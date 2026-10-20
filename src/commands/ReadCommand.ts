import { readFileSync } from 'node:fs';

import { CommandError } from '../model/CommandError.js';
import type { Shape } from '../shapes/Shape.js';
import { SvgReader } from '../io/SvgReader.js';
import type { CommandKind } from './Command.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `read <file.svg>`：读入 SVG 作为当前文档。
 *
 * 文档类命令：清空撤销栈并锁定，直到下一次编辑命令。
 * 读入前先整棵校验 id 唯一性，避免"改了半个文档才报错"。
 */
export class ReadCommand extends Command {
  private readonly path: string;

  public constructor(path: string) {
    super();
    this.path = path;
  }

  public override get kind(): CommandKind {
    return 'io';
  }

  public override execute(session: Session): string {
    let source: string;
    try {
      source = readFileSync(this.path, 'utf8');
    } catch {
      throw CommandError.cannotReadFile(this.path);
    }

    const loaded = new SvgReader().read(source);
    ReadCommand.assertUniqueIds(loaded.children);

    const document = session.document;
    document.reset(loaded.width, loaded.height);
    for (const child of loaded.children) {
      document.root.append(child);
      child.visit((node: Shape) => document.register(node));
    }
    document.path = this.path;

    const summary = `read ${this.path} (${document.count} elements)`;
    return loaded.warnings.length === 0 ? summary : `${loaded.warnings.join('\n')}\n${summary}`;
  }

  private static assertUniqueIds(children: readonly Shape[]): void {
    const seen = new Set<string>();
    for (const child of children) {
      child.visit((node: Shape) => {
        if (seen.has(node.id)) {
          throw CommandError.idExists(node.id);
        }
        seen.add(node.id);
      });
    }
  }
}
