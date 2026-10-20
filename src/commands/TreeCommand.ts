import { Command } from './Command.js';
import type { CommandKind } from './Command.js';
import type { Session } from './Session.js';
import { TreeRenderer } from './TreeRenderer.js';

/** `tree [id]`：结构树。显示类命令，不进撤销栈，也不改变栈的锁定状态。 */
export class TreeCommand extends Command {
  private readonly id: string | null;

  public constructor(id: string | null) {
    super();
    this.id = id;
  }

  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    return new TreeRenderer().render(document, this.id);
  }
}
