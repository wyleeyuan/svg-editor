import { CommandError } from '../model/CommandError.js';
import type { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * 撤销 / 重做栈。
 *
 * 三条规则直接对应作业约定：
 * 1. **一条编辑命令 = 一个 undo 单元**：`run` 只压入一个命令对象，无论它改了多少图形。
 * 2. **io 命令后禁止 undo/redo，直到下一次编辑命令解禁**：io 命令清空双栈并置锁。
 * 3. **undo 后若有新编辑，redo 栈清空**。
 */
export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private locked = false;

  public run(command: Command, session: Session): string {
    const message = command.execute(session);

    switch (command.kind) {
      case 'display':
        return message;
      case 'io':
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.locked = true;
        return message;
      default:
        this.locked = false;
        this.undoStack.push(command);
        this.redoStack.length = 0;
        return message;
    }
  }

  public undo(session: Session): string {
    this.assertUnlocked();
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw CommandError.nothingToUndo();
    }
    const message = command.undo(session);
    this.redoStack.push(command);
    return message;
  }

  public redo(session: Session): string {
    this.assertUnlocked();
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw CommandError.nothingToRedo();
    }
    const message = command.redo(session);
    this.undoStack.push(command);
    return message;
  }

  public get canUndo(): boolean {
    return !this.locked && this.undoStack.length > 0;
  }

  public get canRedo(): boolean {
    return !this.locked && this.redoStack.length > 0;
  }

  private assertUnlocked(): void {
    if (this.locked) {
      throw CommandError.undoNotAllowedAfterIo();
    }
  }
}
