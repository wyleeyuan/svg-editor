import type { CommandKind } from './Command.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `init [w] [h]`：新建空画布。
 *
 * 文档类命令，执行后撤销栈清空并锁定，直到下一次编辑命令。
 */
export class InitCommand extends Command {
  private readonly width: number;
  private readonly height: number;

  public constructor(width: number, height: number) {
    super();
    this.width = width;
    this.height = height;
  }

  public override get kind(): CommandKind {
    return 'io';
  }

  public override execute(session: Session): string {
    session.document.reset(this.width, this.height);
    return `canvas ${this.width}x${this.height} created`;
  }
}
