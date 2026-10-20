import type { Document } from '../model/Document.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';

interface Row {
  readonly prefix: string;
  readonly label: string;
  readonly detail: string;
}

/**
 * `tree` 的渲染：结构树 + 内联几何属性。
 *
 * 属性列**全树对齐到同一列**（含缩进宽度一起算），这样父子层级混排时属性仍然纵向成一列，
 * 和作业示例的排法一致；行的内容是图形自己给的（`Shape.describe()`），
 * 渲染器不认识任何具体类型。
 */
export class TreeRenderer {
  public render(document: Document, rootId: string | null): string {
    const rows: Row[] = [];

    if (rootId === null) {
      rows.push({ prefix: '', label: 'svg', detail: `(${document.width}x${document.height})` });
      this.collect(document.root.children, '', rows);
    } else {
      const shape = document.require(rootId);
      rows.push({ prefix: '', label: TreeRenderer.label(shape), detail: shape.describe() });
      if (ContainerShape.isContainer(shape)) {
        this.collect(shape.children, '', rows);
      }
    }

    return this.format(rows);
  }

  private collect(children: readonly Shape[], indent: string, rows: Row[]): void {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      rows.push({
        prefix: `${indent}${last ? '└── ' : '├── '}`,
        label: TreeRenderer.label(child),
        detail: child.describe(),
      });
      if (ContainerShape.isContainer(child)) {
        this.collect(child.children, `${indent}${last ? '    ' : '│   '}`, rows);
      }
    });
  }

  private format(rows: Row[]): string {
    // 列宽按「缩进 + 标签」的总宽算，跨层级才对得齐；只算标签会让深层的属性右移。
    const column = rows.reduce(
      (max, row) => Math.max(max, row.prefix.length + row.label.length),
      0,
    );
    return rows
      .map((row) => {
        if (row.detail === '') {
          return `${row.prefix}${row.label}`;
        }
        // 根行（无缩进前缀）不参与列对齐，保持 `svg (800x600)` 的紧凑写法。
        if (row.prefix === '') {
          return `${row.label} ${row.detail}`;
        }
        const gap = ' '.repeat(column - row.prefix.length - row.label.length + 2);
        return `${row.prefix}${row.label}${gap}${row.detail}`;
      })
      .join('\n');
  }

  private static label(shape: Shape): string {
    return `${shape.typeName}#${shape.id}`;
  }
}
