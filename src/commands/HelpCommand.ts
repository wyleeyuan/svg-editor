import type { CommandKind } from './Command.js';
import { Command } from './Command.js';

/** 命令用法说明，由注册表提供，保证 `help` 输出与实际注册命令不会脱节。 */
export interface CommandDoc {
  readonly name: string;
  readonly usage: string;
  readonly summary: string;
}

/** `help`：列出全部命令与语法。 */
export class HelpCommand extends Command {
  private readonly docs: () => readonly CommandDoc[];

  public constructor(docs: () => readonly CommandDoc[]) {
    super();
    this.docs = docs;
  }

  public override get kind(): CommandKind {
    return 'display';
  }

  public override execute(): string {
    const docs = this.docs();
    const width = docs.reduce((max, doc) => Math.max(max, doc.usage.length), 0);
    const lines = docs.map((doc) => `  ${doc.usage.padEnd(width)}  ${doc.summary}`);
    return lines.join('\n');
  }
}
