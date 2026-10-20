import { CommandError } from '../model/CommandError.js';
import { Document } from '../model/Document.js';
import { CommandHistory } from './CommandHistory.js';

/**
 * 一次交互会话的全部可变状态：当前文档、撤销栈、退出标记。
 *
 * 把三者放在一起，命令只需接收一个 `Session`，不必各自持有全局状态；
 * 测试里也可以直接 new 一个 Session 驱动命令，无需启动 REPL。
 */
export class Session {
  private readonly _document = new Document();
  private readonly _history = new CommandHistory();
  private _exitRequested = false;

  public get document(): Document {
    return this._document;
  }

  public get history(): CommandHistory {
    return this._history;
  }

  public get exitRequested(): boolean {
    return this._exitRequested;
  }

  public requestExit(): void {
    this._exitRequested = true;
  }

  /** 除 `init` / `read` 外的命令都先过这一关。 */
  public requireDocument(): Document {
    if (!this._document.loaded) {
      throw CommandError.noDocument();
    }
    return this._document;
  }
}
