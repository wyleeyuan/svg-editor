import { CommandError } from '../model/CommandError.js';
import type { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/** z-order 的两种落点。`front` / `back` 共用一套「摘出再插入」的逻辑。 */
export type ZOrder = 'front' | 'back';

/** `front <id>` / `back <id>`：调整同级 z-order。 */
export class ReorderCommand extends Command {
  private readonly id: string;
  private readonly position: ZOrder;
  private parent: ContainerShape | null = null;
  private index = 0;
  private shape: Shape | null = null;

  public constructor(id: string, position: ZOrder) {
    super();
    this.id = id;
    this.position = position;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const shape = this.capture(document.require(this.id));
    const parent = this.parent;
    if (parent === null) {
      throw CommandError.noSuchShape(this.id);
    }

    parent.detach(shape);
    if (this.position === 'front') {
      parent.append(shape);
    } else {
      parent.insertAt(shape, 0);
    }
    return `${shape.typeName}#${shape.id} moved to ${this.position}`;
  }

  public override undo(session: Session): string {
    session.requireDocument();
    const shape = this.shape;
    if (shape === null || this.parent === null) {
      return '';
    }
    shape.parent?.detach(shape);
    this.parent.insertAt(shape, Math.min(this.index, this.parent.childCount));
    return `${shape.typeName}#${shape.id} moved back`;
  }

  private capture(shape: Shape): Shape {
    if (this.shape !== null) {
      return this.shape;
    }
    this.shape = shape;
    this.parent = shape.parent;
    this.index = this.parent === null ? 0 : this.parent.children.indexOf(shape);
    return shape;
  }
}
