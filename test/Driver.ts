import { Session } from '../src/commands/Session.js';
import { CommandRegistry } from '../src/cli/CommandRegistry.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';

/** 直接在测试里驱动完整命令链路，不启动 REPL、不碰 stdin/stdout。 */
export class Driver {
  private readonly session = new Session();
  private readonly registry = new CommandRegistry();
  private readonly tokenizer = new Tokenizer();

  public run(line: string): string {
    const command = this.registry.build(this.tokenizer.tokenize(line));
    return this.session.history.run(command, this.session);
  }

  public undo(): string {
    return this.session.history.undo(this.session);
  }

  public get document(): Session['document'] {
    return this.session.document;
  }
}
