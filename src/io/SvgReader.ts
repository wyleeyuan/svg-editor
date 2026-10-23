import { XMLParser } from 'fast-xml-parser';

import { CommandError } from '../model/CommandError.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import { NumberText } from '../shapes/NumberText.js';
import type { Shape } from '../shapes/Shape.js';

/** XML 节点在 preserveOrder 模式下的形态：`{ 标签名: 子节点[], ':@': 属性 }`。 */
type XmlNode = Record<string, unknown>;

/** `read` 的解析结果，交给命令层灌进 Document。 */
export interface LoadedSvg {
  readonly width: number;
  readonly height: number;
  readonly children: readonly Shape[];
  readonly warnings: readonly string[];
}

/**
 * SVG 文本 → 图形对象树。
 *
 * 两件作业特别要求的事都在这里：
 * 1. **缺 id 自动补全**：按 `标签名+序号` 分配并打印 `warning:`；
 * 2. **保序**：preserveOrder 模式保住了同名元素与不同类型的相对顺序，
 *    否则 `<rect/><circle/><rect/>` 读回来会变成两个 rect 聚在一起。
 *
 * 只认内核的六种标签；`transform` / `style` 与 `path` 这类画得出来但建模不了的标签
 * 本阶段直接忽略，**但会打 `warning:`**——静默丢内容会让用户以为文件读全了
 * （见变化点假设第 6 条）。
 */
export class SvgReader {
  private static readonly SUPPORTED: readonly string[] = [
    'rect',
    'circle',
    'ellipse',
    'line',
    'text',
    'g',
  ];

  /** 内核画不出来、但确实承载图形的标签：丢掉时要出声，别让用户以为读全了。 */
  private static readonly LOSSY_TAGS: readonly string[] = [
    'path',
    'polygon',
    'polyline',
    'use',
    'image',
  ];

  /** 认得但不参与建模的属性：`transform` 会改变几何，`style` 会改变外观。 */
  private static readonly IGNORED_ATTRIBUTES: readonly string[] = ['transform', 'style'];

  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    preserveOrder: true,
    trimValues: true,
    parseAttributeValue: false,
  });

  private used = new Set<string>();
  private counters = new Map<string, number>();
  private warnings: string[] = [];

  public read(source: string): LoadedSvg {
    this.used = new Set<string>();
    this.counters = new Map<string, number>();
    this.warnings = [];

    let parsed: XmlNode[];
    try {
      parsed = this.parser.parse(source) as XmlNode[];
    } catch {
      throw CommandError.invalidArguments('read <file.svg>');
    }

    const root = parsed.find((node) => 'svg' in node);
    if (root === undefined) {
      throw CommandError.invalidArguments('read <file.svg>');
    }

    const attrs = SvgReader.attributes(root);
    const nodes = (root['svg'] ?? []) as XmlNode[];
    this.collectIds(nodes);

    const children: Shape[] = [];
    for (const node of nodes) {
      const shape = this.build(node);
      if (shape !== null) {
        children.push(shape);
      }
    }

    return {
      width: SvgReader.dimension(attrs['width'], attrs['viewBox'], 2, 800),
      height: SvgReader.dimension(attrs['height'], attrs['viewBox'], 3, 600),
      children,
      warnings: this.warnings,
    };
  }

  private build(node: XmlNode): Shape | null {
    const tag = Object.keys(node).find((key) => key !== ':@' && key !== '#text');
    if (tag === undefined) {
      return null;
    }
    if (!SvgReader.SUPPORTED.includes(tag)) {
      // 只对"确实画得出东西"的标签告警：`<title>`、`<metadata>` 这类丢了不影响画面。
      if (SvgReader.LOSSY_TAGS.includes(tag)) {
        this.warnings.push(`warning: skipped unsupported <${tag}>`);
      }
      return null;
    }

    const attrs = SvgReader.attributes(node);
    const children = (node[tag] ?? []) as XmlNode[];
    const id = attrs['id'] === undefined || attrs['id'] === '' ? this.nextId(tag) : attrs['id'];

    for (const name of SvgReader.IGNORED_ATTRIBUTES) {
      if (attrs[name] !== undefined) {
        this.warnings.push(`warning: ignored ${name} on <${tag}#${id}>`);
      }
    }

    const content = children
      .map((child) => child['#text'])
      .filter((text): text is string => typeof text === 'string')
      .join('');
    const shape = ShapeFactory.fromAttributes(tag, id, attrs, content);

    for (const name of ['fill', 'stroke', 'stroke-width']) {
      const value = attrs[name];
      if (value !== undefined) {
        shape.setAttr(name, value);
      }
    }

    if (ContainerShape.isContainer(shape)) {
      for (const child of children) {
        const built = this.build(child);
        if (built !== null) {
          shape.append(built);
        }
      }
    }
    return shape;
  }

  private collectIds(nodes: readonly XmlNode[]): void {
    for (const node of nodes) {
      const tag = Object.keys(node).find((key) => key !== ':@' && key !== '#text');
      if (tag === undefined) {
        continue;
      }
      const id = SvgReader.attributes(node)['id'];
      if (id !== undefined && id !== '') {
        this.used.add(id);
      }
      this.collectIds((node[tag] ?? []) as XmlNode[]);
    }
  }

  /** `rect1`、`circle2`…：序号按标签独立递增，跳过与现有 id 冲突的候选。 */
  private nextId(tag: string): string {
    let counter = this.counters.get(tag) ?? 0;
    let candidate: string;
    do {
      counter += 1;
      candidate = `${tag}${counter}`;
    } while (this.used.has(candidate));
    this.counters.set(tag, counter);
    this.used.add(candidate);
    this.warnings.push(`warning: assigned id ${candidate} to unnamed <${tag}>`);
    return candidate;
  }

  private static attributes(node: XmlNode): Record<string, string> {
    const raw = node[':@'];
    if (raw === undefined || raw === null || typeof raw !== 'object') {
      return {};
    }
    return raw as Record<string, string>;
  }

  private static dimension(
    attribute: string | undefined,
    viewBox: string | undefined,
    index: number,
    fallback: number,
  ): number {
    const direct = attribute === undefined ? null : NumberText.tryParse(attribute);
    if (direct !== null && direct > 0) {
      return direct;
    }
    if (viewBox !== undefined) {
      const parts = viewBox
        .split(/[\s,]+/)
        .filter((part) => part !== '')
        .map((part) => NumberText.tryParse(part));
      const fromViewBox = parts[index];
      if (fromViewBox !== null && fromViewBox !== undefined && fromViewBox > 0) {
        return fromViewBox;
      }
    }
    return fallback;
  }
}
