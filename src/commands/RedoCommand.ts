import type { CommandKind } from './Command.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/** `redo`：重做最近一次被撤销的编辑命令。 */
export class RedoCommand extends Command {
  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(session: Session): string {
    session.requireDocument();
    return session.history.redo(session);
  }
}
