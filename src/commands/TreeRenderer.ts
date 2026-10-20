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
 * 标签列按最长标签对齐，这样扫一眼就能纵向比较属性；行的内容是图形自己给的
 * （`Shape.describe()`），渲染器不认识任何具体类型。
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
    const width = rows.reduce((max, row) => Math.max(max, row.label.length), 0);
    return rows
      .map((row) => {
        if (row.detail === '') {
          return `${row.prefix}${row.label}`;
        }
        // 根行（无缩进前缀）不参与列对齐，保持 `svg (800x600)` 的紧凑写法。
        if (row.prefix === '') {
          return `${row.label} ${row.detail}`;
        }
        const gap = ' '.repeat(width - row.label.length + 2);
        return `${row.prefix}${row.label}${gap}${row.detail}`;
      })
      .join('\n');
  }

  private static label(shape: Shape): string {
    return `${shape.typeName}#${shape.id}`;
  }
}
