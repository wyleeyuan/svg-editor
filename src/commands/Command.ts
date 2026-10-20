import type { Session } from './Session.js';

/**
 * 命令类别，直接对应作业的三条规则：
 * - `edit`：进入撤销栈；一条命令 = 一个 undo 单元；执行后重新允许 undo。
 * - `io`：清空双栈并锁定 undo/redo，直到下一次 `edit` 命令。
 * - `display`：既不进栈也不解锁，完全不影响撤销状态（tree / show / help）。
 */
export type CommandKind = 'edit' | 'io' | 'display';

/**
 * 命令对象。一条 CLI 命令 = 一个 Command 实例，`execute` 与 `undo` 成对。
 *
 * 撤销不做逆运算，而是由子类在首次执行时捕获「受影响图形的属性快照」，
 * 还原时写回——浮点加减与 `1/f` 都不可逆，快照才是精确的。
 */
export abstract class Command {
  public get kind(): CommandKind {
    return 'edit';
  }

  public abstract execute(session: Session): string;

  /** 默认无操作，只有可撤销命令覆写。 */
  public undo(_session: Session): string {
    return '';
  }

  /** 重做复用同一个命令对象，因此子类必须让 `execute` 可重复调用。 */
  public redo(session: Session): string {
    return this.execute(session);
  }
}
