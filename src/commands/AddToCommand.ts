import { CommandError } from '../model/CommandError.js';
import type { Document } from '../model/Document.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `addto <gid> <id>`：把已有图形移入容器，作为最后一个子节点。
 * 与 `group` 的区别是「只移动归属」，不新建容器。
 */
export class AddToCommand extends Command {
  private readonly containerId: string;
  private readonly id: string;
  private shape: Shape | null = null;
  private parent: ContainerShape | null = null;
  private index = 0;

  public constructor(containerId: string, id: string) {
    super();
    this.containerId = containerId;
    this.id = id;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const container = this.resolveContainer(document);
    const shape = this.captureShape(document);

    if (container.contains(shape)) {
      throw CommandError.cannotGroupIntoDescendant(container.id);
    }

    this.parent?.detach(shape);
    container.append(shape);
    return `${shape.typeName}#${shape.id} added to g#${container.id}`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const shape = this.shape;
    if (shape === null || this.parent === null) {
      return '';
    }
    shape.parent?.detach(shape);
    this.parent.insertAt(shape, Math.min(this.index, this.parent.childCount));
    const target = document.isRoot(this.parent) ? 'svg' : `g#${this.parent.id}`;
    return `${shape.typeName}#${shape.id} moved back to ${target}`;
  }

  private resolveContainer(document: Document): ContainerShape {
    const candidate = document.lookup(this.containerId);
    if (candidate === undefined) {
      throw CommandError.noSuchContainer(this.containerId);
    }
    if (!ContainerShape.isContainer(candidate)) {
      throw CommandError.notAContainer(this.containerId);
    }
    return candidate;
  }

  private captureShape(document: Document): Shape {
    if (this.shape !== null) {
      return this.shape;
    }
    this.shape = document.require(this.id);
    this.parent = this.shape.parent;
    this.index = this.parent === null ? 0 : this.parent.children.indexOf(this.shape);
    return this.shape;
  }
}
