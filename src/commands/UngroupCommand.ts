import { CommandError } from '../model/CommandError.js';
import type { Document } from '../model/Document.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `ungroup <gid>`：解散容器，子图形提升到祖父级并占据容器所在位置。
 *
 * 只改结构不改存在性，因此**不碰 id 索引**——子图形一直登记在册，
 * 容器本身在被解散时才注销。
 */
export class UngroupCommand extends Command {
  private readonly id: string;
  private container: ContainerShape | null = null;
  private parent: ContainerShape | null = null;
  private index = 0;
  private children: Shape[] = [];

  public constructor(id: string) {
    super();
    this.id = id;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const container = this.materialize(document);

    for (const child of this.children) {
      container.detach(child);
    }
    this.parent?.detach(container);
    document.unregister(container);

    this.children.forEach((child, offset) => {
      this.parent?.insertAt(child, this.index + offset);
    });
    return `g#${container.id} ungrouped (${UngroupCommand.children(this.children.length)} moved to ${this.parentName()})`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const container = this.container;
    if (container === null || this.parent === null) {
      return '';
    }
    for (const child of this.children) {
      this.parent.detach(child);
    }
    this.parent.insertAt(container, Math.min(this.index, this.parent.childCount));
    if (!document.has(container.id)) {
      document.register(container);
    }
    this.children.forEach((child) => container.append(child));
    return `g#${container.id} regrouped (${UngroupCommand.children(this.children.length)})`;
  }

  private materialize(document: Document): ContainerShape {
    if (this.container !== null) {
      return this.container;
    }
    const shape = document.require(this.id);
    if (!ContainerShape.isContainer(shape)) {
      throw CommandError.notAContainer(this.id);
    }
    const parent = shape.parent;
    if (parent === null) {
      throw CommandError.cannotUngroupTopLevel(this.id);
    }
    if (parent.id === 'svg' || document.isRoot(parent)) {
      throw CommandError.cannotUngroupTopLevel(this.id);
    }
    this.container = shape;
    this.parent = parent;
    this.index = parent.children.indexOf(shape);
    this.children = [...shape.children];
    return shape;
  }

  /** 一个子节点也是 child，别输出 "1 children"。 */
  private static children(count: number): string {
    return count === 1 ? '1 child' : `${count} children`;
  }

  private parentName(): string {
    return this.parent === null ? 'svg' : `g#${this.parent.id}`;
  }
}
