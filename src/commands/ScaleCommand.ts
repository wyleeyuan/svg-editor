import { CommandError } from '../model/CommandError.js';
import { NumberText } from '../shapes/NumberText.js';
import type { Shape, ShapeState } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `scale <id> <factor>`：等比缩放，位置与尺寸同乘；容器递归到子孙。
 *
 * 撤销同样靠快照而非 `scale(1/f)`：`1/1.1 * 1.1` 不等于 1，反复缩放会累积误差。
 */
export class ScaleCommand extends Command {
  private readonly id: string;
  private readonly factor: number;
  private snapshots: Map<string, ShapeState> | null = null;

  public constructor(id: string, factor: number) {
    super();
    this.id = id;
    this.factor = factor;
  }

  public override execute(session: Session): string {
    if (this.factor <= 0) {
      throw CommandError.scaleFactorMustBePositive();
    }
    const document = session.requireDocument();
    const shape = document.require(this.id);
    if (this.snapshots === null) {
      this.snapshots = ScaleCommand.capture(shape);
    }
    shape.scale(this.factor);
    return `${shape.typeName}#${shape.id} scaled by ${NumberText.format(this.factor)}`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    if (this.snapshots !== null) {
      for (const [id, state] of this.snapshots) {
        document.lookup(id)?.restore(state);
      }
    }
    return `${shape.typeName}#${shape.id} scaled back`;
  }

  private static capture(shape: Shape): Map<string, ShapeState> {
    const states = new Map<string, ShapeState>();
    shape.visit((node: Shape) => {
      states.set(node.id, node.snapshot());
    });
    return states;
  }
}
