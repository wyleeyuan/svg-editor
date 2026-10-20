import type { CommandKind } from './Command.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `undo`：撤销上一条编辑命令。
 *
 * 归类为 `display` 而不是 `edit`——它改变的是历史栈，不是文档内容；
 * 若归为 `edit`，撤销动作本身会被压栈，形成自我递归。
 */
export class UndoCommand extends Command {
  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(session: Session): string {
    session.requireDocument();
    return session.history.undo(session);
  }
}
