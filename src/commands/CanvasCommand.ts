import { CommandError } from '../model/CommandError.js';
import { NumberText } from '../shapes/NumberText.js';
import { Command } from './Command.js';
import type { CommandKind } from './Command.js';
import type { Session } from './Session.js';

/**
 * `canvas [w] [h]`：无参数显示尺寸，带参数修改尺寸。
 *
 * 一个命令两种性质：显示不改变任何状态，改尺寸属于文档类操作（不可撤销、
 * 并锁定撤销栈），所以 `kind` 依参数动态决定。
 */
export class CanvasCommand extends Command {
  private readonly width: number | null;
  private readonly height: number | null;

  public constructor(width: number | null, height: number | null) {
    super();
    this.width = width;
    this.height = height;
  }

  public override get kind(): CommandKind {
    return this.width !== null && this.height !== null ? 'io' : 'display';
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    if (this.width !== null && this.height !== null) {
      // 0 或负数的画布存成 SVG 就是非法文件，这里直接拒绝而不是写出坏数据。
      if (this.width <= 0 || this.height <= 0) {
        throw CommandError.invalidArguments('canvas [w] [h]');
      }
      document.resize(this.width, this.height);
    }
    const width = NumberText.format(document.width);
    const height = NumberText.format(document.height);
    return `canvas ${width}x${height}`;
  }
}
