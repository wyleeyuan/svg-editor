import type { Document } from '../model/Document.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import { NumberText } from '../shapes/NumberText.js';
import type { Shape } from '../shapes/Shape.js';

/**
 * 序列化为 SVG 文本。
 *
 * 容器就是普通的 `<g>`，没有 `transform`——内部模型把变换烘焙进了子孙坐标，
 * 这样 `save` 的产物与 `tree` 显示、与 `move` 语义三者始终一致。
 */
export class SvgWriter {
  public write(document: Document): string {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    const width = NumberText.format(document.width);
    const height = NumberText.format(document.height);
    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    );

    for (const child of document.root.children) {
      this.writeShape(child, 1, lines);
    }

    lines.push('</svg>');
    return `${lines.join('\n')}\n`;
  }

  private writeShape(shape: Shape, depth: number, lines: string[]): void {
    const indent = '  '.repeat(depth);
    const tag = shape.typeName;
    const attrs = [`id="${SvgWriter.escapeAttribute(shape.id)}"`];

    for (const [name, value] of shape.attributePairs()) {
      // 文本内容是元素体，不是属性。
      if (name === 'text') {
        continue;
      }
      attrs.push(`${name}="${SvgWriter.escapeAttribute(value)}"`);
    }

    if (ContainerShape.isContainer(shape)) {
      lines.push(`${indent}<${tag} ${attrs.join(' ')}>`);
      for (const child of shape.children) {
        this.writeShape(child, depth + 1, lines);
      }
      lines.push(`${indent}</${tag}>`);
      return;
    }

    const content = shape.getAttr('text');
    if (content === undefined) {
      lines.push(`${indent}<${tag} ${attrs.join(' ')}/>`);
    } else {
      lines.push(`${indent}<${tag} ${attrs.join(' ')}>${SvgWriter.escapeText(content)}</${tag}>`);
    }
  }

  private static escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private static escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
