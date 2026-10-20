import { CircleShape } from '../shapes/CircleShape.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import { EllipseShape } from '../shapes/EllipseShape.js';
import { LineShape } from '../shapes/LineShape.js';
import { RectShape } from '../shapes/RectShape.js';
import type { Shape } from '../shapes/Shape.js';
import { TextShape } from '../shapes/TextShape.js';
import { CommandError } from './CommandError.js';

/**
 * 图形工厂：类型名 → 具体类。
 *
 * **这是全项目仅有的两处「按名字分派」之一**（另一处是 CommandRegistry）。
 * TODO(plugin-phase): 插件化阶段改为 ShapeProvider 注册表，届时本 switch 会消失，
 * 内核不再认识任何具体图形类型。
 */
export class ShapeFactory {
  /** 内核内置的六种类型；`box` 属插件阶段目标，此处不登记。 */
  public static readonly BUILTIN_TYPES: readonly string[] = [
    'rect',
    'circle',
    'ellipse',
    'line',
    'text',
    'g',
  ];

  public static create(type: string, id: string, params: readonly string[]): Shape {
    switch (type) {
      case 'rect':
        return ShapeFactory.createRect(id, params);
      case 'circle':
        return ShapeFactory.createCircle(id, params);
      case 'ellipse':
        return ShapeFactory.createEllipse(id, params);
      case 'line':
        return ShapeFactory.createLine(id, params);
      case 'text':
        return ShapeFactory.createText(id, params);
      case 'g':
        return new ContainerShape(id);
      default:
        throw CommandError.unknownShapeType(type);
    }
  }

  /**
   * 各类型的「构造参数 ← SVG 属性名」映射表。
   *
   * `#text` 是伪属性名，指元素标签之间的文本内容（只有 `<text>` 用得上）。
   * 把这张表放在工厂里，解析器就只负责读出属性字典、不参与任何类型判断，
   * 全项目的「按类型名分派」因此只剩 {@link ShapeFactory.create} 一处。
   */
  private static readonly PARAM_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
    rect: ['x', 'y', 'width', 'height'],
    circle: ['cx', 'cy', 'r'],
    ellipse: ['cx', 'cy', 'rx', 'ry'],
    line: ['x1', 'y1', 'x2', 'y2'],
    text: ['x', 'y', '#text'],
    g: [],
  };

  /** 按 SVG 属性表创建图形，供 `read` 使用；缺省属性按 0 处理。 */
  public static fromAttributes(
    type: string,
    id: string,
    attrs: Readonly<Record<string, string>>,
    text = '',
  ): Shape {
    const names = ShapeFactory.PARAM_ATTRIBUTES[type];
    if (names === undefined) {
      throw CommandError.unknownShapeType(type);
    }
    const params = names.map((name) => (name === '#text' ? text : (attrs[name] ?? '0')));
    return ShapeFactory.create(type, id, params);
  }

  private static createRect(id: string, params: readonly string[]): Shape {
    const shape = new RectShape(
      id,
      ShapeFactory.num(params, 0, 'rect'),
      ShapeFactory.num(params, 1, 'rect'),
      ShapeFactory.num(params, 2, 'rect'),
      ShapeFactory.num(params, 3, 'rect'),
    );
    return ShapeFactory.withPaint(shape, params[4]);
  }

  private static createCircle(id: string, params: readonly string[]): Shape {
    const shape = new CircleShape(
      id,
      ShapeFactory.num(params, 0, 'circle'),
      ShapeFactory.num(params, 1, 'circle'),
      ShapeFactory.num(params, 2, 'circle'),
    );
    return ShapeFactory.withPaint(shape, params[3]);
  }

  private static createEllipse(id: string, params: readonly string[]): Shape {
    const shape = new EllipseShape(
      id,
      ShapeFactory.num(params, 0, 'ellipse'),
      ShapeFactory.num(params, 1, 'ellipse'),
      ShapeFactory.num(params, 2, 'ellipse'),
      ShapeFactory.num(params, 3, 'ellipse'),
    );
    return ShapeFactory.withPaint(shape, params[4]);
  }

  private static createLine(id: string, params: readonly string[]): Shape {
    const shape = new LineShape(
      id,
      ShapeFactory.num(params, 0, 'line'),
      ShapeFactory.num(params, 1, 'line'),
      ShapeFactory.num(params, 2, 'line'),
      ShapeFactory.num(params, 3, 'line'),
    );
    return ShapeFactory.withStroke(shape, params[4]);
  }

  private static createText(id: string, params: readonly string[]): Shape {
    return new TextShape(
      id,
      ShapeFactory.num(params, 0, 'text'),
      ShapeFactory.num(params, 1, 'text'),
      ShapeFactory.arg(params, 2, 'text'),
    );
  }

  /** 省略时**不写入**该属性，交给 SVG 渲染默认值（fill 初始 black、stroke 初始 none）。 */
  private static withPaint(shape: Shape, fill: string | undefined): Shape {
    if (fill !== undefined) {
      shape.setAttr('fill', fill);
    }
    return shape;
  }

  private static withStroke(shape: Shape, stroke: string | undefined): Shape {
    if (stroke !== undefined) {
      shape.setAttr('stroke', stroke);
    }
    return shape;
  }

  private static arg(params: readonly string[], index: number, type: string): string {
    const value = params[index];
    if (value === undefined) {
      throw CommandError.invalidArguments(`create ${type} <id> ...`);
    }
    return value;
  }

  private static num(params: readonly string[], index: number, type: string): number {
    const raw = ShapeFactory.arg(params, index, type);
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw CommandError.invalidArguments(`create ${type} <id> ... (${raw} is not a number)`);
    }
    return value;
  }
}
