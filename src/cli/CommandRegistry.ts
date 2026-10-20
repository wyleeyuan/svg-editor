import { AddToCommand } from '../commands/AddToCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import type { Command } from '../commands/Command.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { ExitCommand } from '../commands/ExitCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import type { CommandDoc } from '../commands/HelpCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
import { ReorderCommand } from '../commands/ReorderCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { CommandError } from '../model/CommandError.js';

type CommandBuilder = (args: readonly string[]) => Command;

/**
 * 命令注册表：命令名 → 命令对象。
 *
 * **这是全项目仅有的两处「按名字分派」之一**（另一处是 ShapeFactory）。
 * TODO(plugin-phase): 命令若也要插件化，此处改为可注册的 CommandProvider；
 * 本阶段保持集中登记，便于一眼看全命令面。
 */
export class CommandRegistry {
  private readonly builders = new Map<string, CommandBuilder>();
  private readonly docs: CommandDoc[] = [];

  public constructor() {
    this.registerDefaults();
  }

  public build(tokens: readonly string[]): Command {
    const name = tokens[0];
    if (name === undefined) {
      throw CommandError.unknownCommand('');
    }
    const builder = this.builders.get(name);
    if (builder === undefined) {
      throw CommandError.unknownCommand(name);
    }
    return builder(tokens.slice(1));
  }

  public get documentation(): readonly CommandDoc[] {
    return this.docs;
  }

  private registerDoc(name: string, usage: string, summary: string, builder: CommandBuilder): void {
    this.builders.set(name, builder);
    this.docs.push({ name, usage, summary });
  }

  private registerDefaults(): void {
    this.registerDoc(
      'init',
      'init [w] [h]',
      'new empty canvas (default 800x600)',
      (args) =>
        new InitCommand(
          CommandRegistry.optionalNumber(args, 0, 800, 'init [w] [h]'),
          CommandRegistry.optionalNumber(args, 1, 600, 'init [w] [h]'),
        ),
    );

    this.registerDoc(
      'create',
      'create <type> <id> [params…] [in <containerId>]',
      'create a shape (rect circle ellipse line text g)',
      (args) => CommandRegistry.create(args),
    );

    this.registerDoc('delete', 'delete <id>', 'delete a shape and its descendants', (args) => {
      const id = CommandRegistry.required(args, 0, 'delete <id>');
      return new DeleteCommand(id);
    });

    this.registerDoc('move', 'move <id> <dx> <dy>', 'translate a shape', (args) => {
      const id = CommandRegistry.required(args, 0, 'move <id> <dx> <dy>');
      return new MoveCommand(
        id,
        CommandRegistry.requiredNumber(args, 1, 'move <id> <dx> <dy>'),
        CommandRegistry.requiredNumber(args, 2, 'move <id> <dx> <dy>'),
      );
    });

    this.registerDoc('scale', 'scale <id> <factor>', 'scale a shape uniformly', (args) => {
      const id = CommandRegistry.required(args, 0, 'scale <id> <factor>');
      return new ScaleCommand(id, CommandRegistry.requiredNumber(args, 1, 'scale <id> <factor>'));
    });

    this.registerDoc(
      'group',
      'group <newGid> <id1> <id2>…',
      'collect existing shapes into a new container',
      (args) => {
        const groupId = CommandRegistry.required(args, 0, 'group <newGid> <id1> <id2>…');
        return new GroupCommand(groupId, args.slice(1));
      },
    );

    this.registerDoc('ungroup', 'ungroup <gid>', 'dissolve a container', (args) => {
      return new UngroupCommand(CommandRegistry.required(args, 0, 'ungroup <gid>'));
    });

    this.registerDoc('addto', 'addto <gid> <id>', 'move a shape into a container', (args) => {
      const usage = 'addto <gid> <id>';
      return new AddToCommand(
        CommandRegistry.required(args, 0, usage),
        CommandRegistry.required(args, 1, usage),
      );
    });

    this.registerDoc('front', 'front <id>', 'bring a shape to the front', (args) => {
      return new ReorderCommand(CommandRegistry.required(args, 0, 'front <id>'), 'front');
    });

    this.registerDoc('back', 'back <id>', 'send a shape to the back', (args) => {
      return new ReorderCommand(CommandRegistry.required(args, 0, 'back <id>'), 'back');
    });

    this.registerDoc('set', 'set <id> <attr> <value>', 'set an attribute', (args) => {
      const usage = 'set <id> <attr> <value>';
      return new SetCommand(
        CommandRegistry.required(args, 0, usage),
        CommandRegistry.required(args, 1, usage),
        CommandRegistry.required(args, 2, usage),
      );
    });

    this.registerDoc('tree', 'tree [id]', 'show the structure tree', (args) => {
      return new TreeCommand(args[0] ?? null);
    });

    this.registerDoc('show', 'show <id>', 'show attributes of a shape', (args) => {
      return new ShowCommand(CommandRegistry.required(args, 0, 'show <id>'));
    });

    this.registerDoc('undo', 'undo', 'undo the last edit', () => new UndoCommand());
    this.registerDoc('redo', 'redo', 'redo the last undone edit', () => new RedoCommand());

    this.registerDoc('help', 'help', 'show this list', () => new HelpCommand(() => this.docs));

    this.registerDoc('exit', 'exit', 'quit the editor', () => new ExitCommand());
    this.registerDoc('quit', 'quit', 'alias of exit', () => new ExitCommand());
  }

  private static create(args: readonly string[]): Command {
    const usage = 'create <type> <id> [params…] [in <containerId>]';
    const inIndex = args.indexOf('in');
    const head = inIndex < 0 ? args : args.slice(0, inIndex);
    const containerId = inIndex < 0 ? null : (args[inIndex + 1] ?? null);

    if (inIndex >= 0 && containerId === null) {
      throw CommandError.invalidArguments(usage);
    }

    const type = head[0];
    const id = head[1];
    if (type === undefined || id === undefined) {
      throw CommandError.invalidArguments(usage);
    }
    return new CreateCommand(type, id, head.slice(2), containerId);
  }

  private static required(args: readonly string[], index: number, usage: string): string {
    const value = args[index];
    if (value === undefined) {
      throw CommandError.invalidArguments(usage);
    }
    return value;
  }

  private static requiredNumber(args: readonly string[], index: number, usage: string): number {
    return CommandRegistry.parseNumber(CommandRegistry.required(args, index, usage), usage);
  }

  private static optionalNumber(
    args: readonly string[],
    index: number,
    fallback: number,
    usage: string,
  ): number {
    const raw = args[index];
    if (raw === undefined) {
      return fallback;
    }
    return CommandRegistry.parseNumber(raw, usage);
  }

  private static parseNumber(raw: string, usage: string): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw CommandError.invalidArguments(usage);
    }
    return value;
  }
}
