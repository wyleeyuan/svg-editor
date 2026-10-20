import { createInterface } from 'node:readline';
import type { Interface as ReadlineInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

import { Session } from '../commands/Session.js';
import { CommandError } from '../model/CommandError.js';
import { CommandRegistry } from './CommandRegistry.js';
import { Tokenizer } from './Tokenizer.js';

/**
 * 交互式命令行外壳：逐行读入命令、单条命令失败不影响会话状态。
 *
 * 自己只负责三件事：读行、跳过注释与空行、把异常渲染成 `error:` 输出。
 * 命令怎么执行由 CommandRegistry + Session 决定，REPL 不认识任何具体命令。
 */
export class Repl {
  public static readonly VERSION = '0.1';

  private readonly rl: ReadlineInterface;
  private readonly session = new Session();
  private readonly registry = new CommandRegistry();
  private readonly tokenizer = new Tokenizer();
  private closed = false;

  public constructor() {
    this.rl = createInterface({ input: stdin, output: stdout, prompt: 'svg> ' });
  }

  public start(): void {
    stdout.write(`svg-editor ${Repl.VERSION} — type 'help' for commands\n\n`);

    this.rl.on('line', (line: string) => {
      this.handleLine(line);
      if (this.session.exitRequested) {
        this.closed = true;
        this.rl.close();
        return;
      }
      this.prompt();
    });

    this.rl.on('close', () => {
      this.closed = true;
    });

    this.prompt();
  }

  private prompt(): void {
    if (!this.closed) {
      this.rl.prompt();
    }
  }

  private handleLine(line: string): void {
    const trimmed = line.trim();

    // 空行与 `#` 开头的注释不参与执行，便于把命令序列存成脚本回放。
    if (trimmed === '' || trimmed.startsWith('#')) {
      return;
    }

    try {
      const tokens = this.tokenizer.tokenize(trimmed);
      const command = this.registry.build(tokens);
      const message = this.session.history.run(command, this.session);
      if (message !== '') {
        stdout.write(`${message}\n`);
      }
    } catch (error) {
      this.report(error);
    }
  }

  private report(error: unknown): void {
    if (error instanceof CommandError) {
      stdout.write(`error: ${error.message}\n`);
      return;
    }
    throw error;
  }
}
