import { CommandError } from '../model/CommandError.js';
import type { ShapeState } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `set <id> <attr> <value>`：设置属性。
 *
 * 白名单由图形自己判定（`Shape.setAttr` 返回 false 即不认识），
 * 命令只负责把 false 翻译成 `error: unknown attribute: …`。
 * 撤销用执行前的属性快照，因此 `text` 内容与 `fill` 走同一条还原路径。
 */
export class SetCommand extends Command {
  private readonly id: string;
  private readonly attribute: string;
  private readonly value: string;
  private snapshot: ShapeState | null = null;

  public constructor(id: string, attribute: string, value: string) {
    super();
    this.id = id;
    this.attribute = attribute;
    this.value = value;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    // 空值只会写出 `fill=""` 这类非法属性，唯一的例外是 text：清空文本是合理操作。
    if (this.value === '' && this.attribute !== 'text') {
      throw CommandError.invalidArguments('set <id> <attr> <value>');
    }
    if (this.snapshot === null) {
      this.snapshot = shape.snapshot();
    }

    let accepted: boolean;
    try {
      accepted = shape.setAttr(this.attribute, this.value);
    } catch (error) {
      if (error instanceof RangeError) {
        throw CommandError.invalidArguments('set <id> <attr> <value>');
      }
      throw error;
    }

    if (!accepted) {
      throw CommandError.unknownAttribute(this.attribute);
    }
    return `${shape.typeName}#${shape.id} updated: ${SetCommand.render(this.attribute, this.value)}`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const shape = document.require(this.id);
    if (this.snapshot !== null) {
      shape.restore(this.snapshot);
    }
    const restored = shape.getAttr(this.attribute) ?? '';
    return `${shape.typeName}#${shape.id} updated: ${SetCommand.render(this.attribute, restored)}`;
  }

  /** `text` 是自由文本，回显时加引号以便看出边界；其余属性是数值或颜色，直接输出。 */
  private static render(attribute: string, value: string): string {
    return attribute === 'text' ? `${attribute}="${value}"` : `${attribute}=${value}`;
  }
}
