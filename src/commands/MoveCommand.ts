import type { Document } from '../model/Document.js';
import { NumberText } from '../shapes/NumberText.js';
import type { Point, Shape, ShapeState } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `move <id> <dx> <dy>`：增量平移。
 *
 * 撤销不用 `move(-dx,-dy)`——浮点加减不可逆（`0.1 + 0.2 - 0.2 ≠ 0.1`）。
 * 首次执行前对**整棵子树**拍属性快照，撤销时按 id 逐个写回。
 */
export class MoveCommand extends Command {
  private readonly id: string;
  private readonly dx: number;
  private readonly dy: number;
  private snapshots: Map<string, ShapeState> | null = null;

  public constructor(id: string, dx: number, dy: number) {
    super();
    this.id = id;
    this.dx = dx;
    this.dy = dy;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    if (this.snapshots === null) {
      this.snapshots = MoveCommand.capture(shape);
    }
    shape.move(this.dx, this.dy);
    return MoveCommand.describe(shape, (anchor) =>
      anchor === null
        ? `moved by (${NumberText.format(this.dx)},${NumberText.format(this.dy)})`
        : `moved to (${NumberText.format(anchor.x)},${NumberText.format(anchor.y)})`,
    );
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    this.restore(document);
    return MoveCommand.describe(shape, (anchor) =>
      anchor === null
        ? `moved back by (${NumberText.format(-this.dx)},${NumberText.format(-this.dy)})`
        : `moved back to (${NumberText.format(anchor.x)},${NumberText.format(anchor.y)})`,
    );
  }

  private restore(document: Document): void {
    if (this.snapshots === null) {
      return;
    }
    for (const [id, state] of this.snapshots) {
      document.lookup(id)?.restore(state);
    }
  }

  private static capture(shape: Shape): Map<string, ShapeState> {
    const states = new Map<string, ShapeState>();
    shape.visit((node: Shape) => {
      states.set(node.id, node.snapshot());
    });
    return states;
  }

  private static describe(shape: Shape, template: (anchor: Point | null) => string): string {
    return `${shape.typeName}#${shape.id} ${template(shape.anchor)}`;
  }
}
