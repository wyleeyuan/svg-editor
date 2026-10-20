import { writeFileSync } from 'node:fs';

import { CommandError } from '../model/CommandError.js';
import { SvgWriter } from '../io/SvgWriter.js';
import { Command } from './Command.js';
import type { CommandKind } from './Command.js';
import type { Session } from './Session.js';

/**
 * `save [file.svg]`：序列化当前文档。
 * 省略参数时写回 `read` 时的路径；`init` 出来的文档没有路径，必须显式给出。
 */
export class SaveCommand extends Command {
  private readonly path: string | null;

  public constructor(path: string | null) {
    super();
    this.path = path;
  }

  public override get kind(): CommandKind {
    return 'io';
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const target = this.path ?? document.path;
    if (target === null) {
      throw CommandError.invalidArguments('save [file.svg]');
    }

    try {
      writeFileSync(target, new SvgWriter().write(document), 'utf8');
    } catch {
      throw CommandError.cannotWriteFile(target);
    }

    document.path = target;
    return `saved to ${target} (${document.count} elements)`;
  }
}
