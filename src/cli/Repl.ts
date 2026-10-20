import { createInterface } from 'node:readline';
import type { Interface as ReadlineInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

/**
 * 交互式命令行外壳：逐行读入命令、单条命令失败不影响会话状态。
 *
 * 本阶段（c001）只负责"读一行 -> 交给分派 -> 再提示"，不含任何文档/图形逻辑；
 * 命令解析与 Command 模式在后续提交中引入。
 */
export class Repl {
  static readonly VERSION = '0.1';

  private static readonly HELP = [
    'document : init [w] [h] | read <file.svg> | save [file.svg] | canvas [w] [h]',
    'editing  : create | delete | move | scale | set | group | ungroup | addto | front | back',
    'display  : tree [id] | show <id> | help',
    'history  : undo | redo',
    'session  : exit | quit',
  ].join('\n');

  private readonly rl: ReadlineInterface;
  private closed = false;

  constructor() {
    this.rl = createInterface({ input: stdin, output: stdout, prompt: 'svg> ' });
  }

  start(): void {
    stdout.write(`svg-editor ${Repl.VERSION} — type 'help' for commands\n\n`);

    this.rl.on('line', (line: string) => {
      this.handleLine(line);
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

    // 空行与 `#` 注释不参与执行，便于把命令序列存成脚本回放。
    if (trimmed === '' || trimmed.startsWith('#')) {
      return;
    }

    const [name = ''] = trimmed.split(/\s+/);

    switch (name) {
      case 'help':
        stdout.write(`${Repl.HELP}\n`);
        break;
      case 'exit':
      case 'quit':
        this.closed = true;
        this.rl.close();
        break;
      default:
        stdout.write(`error: unknown command: ${name}\n`);
    }
  }
}
