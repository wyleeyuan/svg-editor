import { AddToCommand } from '../commands/AddToCommand.js';
import { CanvasCommand } from '../commands/CanvasCommand.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import type { Command } from '../commands/Command.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { ExitCommand } from '../commands/ExitCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import type { CommandDoc } from '../commands/HelpCommand.js';
import { HelpCommand } from '../commands/HelpCommand.js';
import { InitCommand } from '../commands/InitCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ReadCommand } from '../commands/ReadCommand.js';
import { RedoCommand } from '../commands/RedoCommand.js';
import { ReorderCommand } from '../commands/ReorderCommand.js';
import { SaveCommand } from '../commands/SaveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { ShowCommand } from '../commands/ShowCommand.js';
import { TreeCommand } from '../commands/TreeCommand.js';
import { UndoCommand } from '../commands/UndoCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { CommandError } from '../model/CommandError.js';
import { NumberText } from '../shapes/NumberText.js';

type CommandBuilder = (args: readonly string[]) => Command;

/** 参数个数：单个数字表示「恰好这么多」，数组表示闭区间，`Infinity` 表示不限。 */
type Arity = number | readonly [number, number];

interface Registration {
  readonly usage: string;
  readonly summary: string;
  readonly arity: readonly [number, number];
  readonly builder: CommandBuilder;
}

/**
 * 命令注册表：命令名 → 命令对象。
 *
 * **这是全项目仅有的两处「按名字分派」之一**（另一处是 ShapeFactory）。
 * TODO(plugin): 命令若也要插件化，此处改为可注册的 CommandProvider；
 * 本阶段保持集中登记，便于一眼看全命令面。
 *
 * 参数个数也在这一层校验：每条命令都要在登记时说明自己收几个参数，
 * 多打的字会报 `invalid arguments` 而不是被静默丢掉——`save a.svg b.svg`
 * 只写一个文件、`delete r1 r2` 只删一个，都是不该发生的意外。
 */
export class CommandRegistry {
  private readonly registrations = new Map<string, Registration>();
  private readonly docs: CommandDoc[] = [];

  public constructor() {
    this.registerDefaults();
  }

  public build(tokens: readonly string[]): Command {
    const name = tokens[0];
    if (name === undefined) {
      throw CommandError.unknownCommand('');
    }
    const registration = this.registrations.get(name);
    if (registration === undefined) {
      throw CommandError.unknownCommand(name);
    }

    const args = tokens.slice(1);
    const [min, max] = registration.arity;
    if (args.length < min || args.length > max) {
      throw CommandError.invalidArguments(registration.usage);
    }
    return registration.builder(args);
  }

  public get documentation(): readonly CommandDoc[] {
    return this.docs;
  }

  private registerDoc(
    name: string,
    usage: string,
    summary: string,
    arity: Arity,
    builder: CommandBuilder,
  ): void {
    const range: readonly [number, number] = typeof arity === 'number' ? [arity, arity] : arity;
    this.registrations.set(name, { usage, summary, arity: range, builder });
    this.docs.push({ name, usage, summary });
  }

  private registerDefaults(): void {
    this.registerDoc(
      'init',
      'init [w] [h]',
      'new empty canvas (default 800x600)',
      [0, 2],
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
      [2, Infinity],
      (args) => CommandRegistry.create(args),
    );

    this.registerDoc('read', 'read <file.svg>', 'load an SVG file', 1, (args) => {
      return new ReadCommand(CommandRegistry.required(args, 0, 'read <file.svg>'));
    });

    this.registerDoc('save', 'save [file.svg]', 'write the document to a file', [0, 1], (args) => {
      return new SaveCommand(args[0] ?? null);
    });

    this.registerDoc('canvas', 'canvas [w] [h]', 'show or resize the canvas', [0, 2], (args) => {
      const usage = 'canvas [w] [h]';
      if (args[0] === undefined) {
        return new CanvasCommand(null, null);
      }
      if (args[1] === undefined) {
        throw CommandError.invalidArguments(usage);
      }
      return new CanvasCommand(
        CommandRegistry.requiredNumber(args, 0, usage),
        CommandRegistry.requiredNumber(args, 1, usage),
      );
    });

    this.registerDoc('delete', 'delete <id>', 'delete a shape and its descendants', 1, (args) => {
      return new DeleteCommand(CommandRegistry.required(args, 0, 'delete <id>'));
    });

    this.registerDoc('move', 'move <id> <dx> <dy>', 'translate a shape', 3, (args) => {
      const id = CommandRegistry.required(args, 0, 'move <id> <dx> <dy>');
      return new MoveCommand(
        id,
        CommandRegistry.requiredNumber(args, 1, 'move <id> <dx> <dy>'),
        CommandRegistry.requiredNumber(args, 2, 'move <id> <dx> <dy>'),
      );
    });

    this.registerDoc('scale', 'scale <id> <factor>', 'scale a shape uniformly', 2, (args) => {
      const id = CommandRegistry.required(args, 0, 'scale <id> <factor>');
      return new ScaleCommand(id, CommandRegistry.requiredNumber(args, 1, 'scale <id> <factor>'));
    });

    this.registerDoc(
      'group',
      'group <newGid> <id1> <id2>…',
      'collect existing shapes into a new container',
      [2, Infinity],
      (args) => {
        const groupId = CommandRegistry.required(args, 0, 'group <newGid> <id1> <id2>…');
        return new GroupCommand(groupId, args.slice(1));
      },
    );

    this.registerDoc('ungroup', 'ungroup <gid>', 'dissolve a container', 1, (args) => {
      return new UngroupCommand(CommandRegistry.required(args, 0, 'ungroup <gid>'));
    });

    this.registerDoc('addto', 'addto <gid> <id>', 'move a shape into a container', 2, (args) => {
      const usage = 'addto <gid> <id>';
      return new AddToCommand(
        CommandRegistry.required(args, 0, usage),
        CommandRegistry.required(args, 1, usage),
      );
    });

    this.registerDoc('front', 'front <id>', 'bring a shape to the front', 1, (args) => {
      return new ReorderCommand(CommandRegistry.required(args, 0, 'front <id>'), 'front');
    });

    this.registerDoc('back', 'back <id>', 'send a shape to the back', 1, (args) => {
      return new ReorderCommand(CommandRegistry.required(args, 0, 'back <id>'), 'back');
    });

    this.registerDoc('set', 'set <id> <attr> <value>', 'set an attribute', 3, (args) => {
      const usage = 'set <id> <attr> <value>';
      return new SetCommand(
        CommandRegistry.required(args, 0, usage),
        CommandRegistry.required(args, 1, usage),
        CommandRegistry.required(args, 2, usage),
      );
    });

    this.registerDoc('tree', 'tree [id]', 'show the structure tree', [0, 1], (args) => {
      return new TreeCommand(args[0] ?? null);
    });

    this.registerDoc('show', 'show <id>', 'show attributes of a shape', 1, (args) => {
      return new ShowCommand(CommandRegistry.required(args, 0, 'show <id>'));
    });

    this.registerDoc('undo', 'undo', 'undo the last edit', 0, () => new UndoCommand());
    this.registerDoc('redo', 'redo', 'redo the last undone edit', 0, () => new RedoCommand());

    this.registerDoc('help', 'help', 'show this list', 0, () => new HelpCommand(() => this.docs));

    this.registerDoc('exit', 'exit', 'quit the editor', 0, () => new ExitCommand());
    this.registerDoc('quit', 'quit', 'alias of exit', 0, () => new ExitCommand());
  }

  private static create(args: readonly string[]): Command {
    const usage = 'create <type> <id> [params…] [in <containerId>]';
    // `in` 只认倒数第二个位置。文本内容本身可能正好是 "in"
    // （`create text t 0 0 "in"`），从左往右找会把它当成分隔符。
    const hasClause = args.length >= 2 && args[args.length - 2] === 'in';
    const head = hasClause ? args.slice(0, -2) : args;
    const containerId = hasClause ? (args[args.length - 1] ?? null) : null;

    if (hasClause && containerId === null) {
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
    // 与图形属性共用同一套数字判定：空串不是 0，`10px` 可以接受。
    const value = NumberText.tryParse(raw);
    if (value === null) {
      throw CommandError.invalidArguments(usage);
    }
    return value;
  }
}
