import { CommandError } from '../model/CommandError.js';
import type { Document } from '../model/Document.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `create <type> <id> [params…] [in <containerId>]`
 *
 * 形状对象在**首次执行**时创建并记住引用；`undo` 只是把它从树上摘下来，
 * `redo` 再把同一个对象挂回去。这样重做不会产生"新对象"，撤销栈始终保持一致。
 */
export class CreateCommand extends Command {
  private readonly type: string;
  private readonly id: string;
  private readonly params: readonly string[];
  private readonly containerId: string | null;
  private shape: Shape | null = null;

  public constructor(
    type: string,
    id: string,
    params: readonly string[],
    containerId: string | null = null,
  ) {
    super();
    this.type = type;
    this.id = id;
    this.params = params;
    this.containerId = containerId;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const parent = this.resolveParent(document);
    const shape = this.materialize(document);
    document.attach(shape, parent, parent.childCount);
    const suffix = this.containerId === null ? '' : ` in g#${this.containerId}`;
    return `${shape.typeName}#${shape.id} created${suffix}`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    if (this.shape === null) {
      return '';
    }
    this.shape.parent?.detach(this.shape);
    document.unregister(this.shape);
    return `${this.shape.typeName}#${this.shape.id} removed`;
  }

  private materialize(document: Document): Shape {
    if (this.shape !== null) {
      return this.shape;
    }
    if (document.has(this.id)) {
      throw CommandError.idExists(this.id);
    }
    this.shape = ShapeFactory.create(this.type, this.id, this.params);
    return this.shape;
  }

  private resolveParent(document: Document): ContainerShape {
    if (this.containerId === null) {
      return document.root;
    }
    const candidate = document.lookup(this.containerId);
    if (candidate === undefined) {
      throw CommandError.noSuchContainer(this.containerId);
    }
    if (!ContainerShape.isContainer(candidate)) {
      throw CommandError.notAContainer(this.containerId);
    }
    return candidate;
  }
}
