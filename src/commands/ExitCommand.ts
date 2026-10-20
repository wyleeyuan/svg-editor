import type { CommandKind } from './Command.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/** `exit` / `quit`：结束会话，不属于文档编辑，不进入撤销栈。 */
export class ExitCommand extends Command {
  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(session: Session): string {
    session.requestExit();
    return '';
  }
}
