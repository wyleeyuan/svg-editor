import { Command } from './Command.js';
import type { CommandKind } from './Command.js';
import type { Session } from './Session.js';
import { ShowRenderer } from './ShowRenderer.js';

/** `show <id>`：单个图形的属性明细。 */
export class ShowCommand extends Command {
  private readonly id: string;

  public constructor(id: string) {
    super();
    this.id = id;
  }

  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    return new ShowRenderer().render(document, this.id);
  }
}
