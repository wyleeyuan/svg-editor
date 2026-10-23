import type { Document } from '../model/Document.js';
import type { Shape } from '../shapes/Shape.js';

/**
 * `show` 的渲染：类型、父容器、属性明细。
 *
 * 几何属性与外观属性分两行，是作业 5.2 的格式；空的分组直接省略，
 * 所以容器只有第一行，而 `text` 会把内容显示在几何行里。
 */
export class ShowRenderer {
  public render(document: Document, id: string): string {
    const shape = document.require(id);
    const lines: string[] = [
      `${shape.typeName}#${shape.id}  parent=${ShowRenderer.parentName(document, shape)}`,
    ];

    const geometry = ShowRenderer.pairs(shape, shape.attributeNames());
    if (geometry !== '') {
      lines.push(`  ${geometry}`);
    }

    const paint = ShowRenderer.pairs(shape, ['fill', 'stroke', 'stroke-width']);
    if (paint !== '') {
      lines.push(`  ${paint}`);
    }

    return lines.join('\n');
  }

  private static pairs(shape: Shape, names: readonly string[]): string {
    return names
      .map((name) => [name, shape.getAttr(name)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== undefined)
      .map(([name, value]) => (name === 'text' ? `text="${value}"` : `${name}=${value}`))
      .join(' ');
  }

  private static parentName(document: Document, shape: Shape): string {
    const parent = shape.parent;
    if (parent === null || document.isRoot(parent)) {
      return 'svg';
    }
    return `g#${parent.id}`;
  }
}
