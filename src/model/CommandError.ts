/**
 * 面向用户的命令错误。消息**不含** `error:` 前缀——前缀由输出层统一添加，
 * 这样所有失败路径只有一个地方决定格式。
 *
 * 各静态工厂对应作业 4.2 的错误信息约定，新增错误必须走这里，避免消息散落在各处。
 */
export class CommandError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CommandError';
  }

  public static idExists(id: string): CommandError {
    return new CommandError(`id already exists: ${id}`);
  }

  public static noSuchShape(id: string): CommandError {
    return new CommandError(`no such shape: ${id}`);
  }

  public static noSuchContainer(id: string): CommandError {
    return new CommandError(`no such container: ${id}`);
  }

  public static notAContainer(id: string): CommandError {
    return new CommandError(`not a container: ${id}`);
  }

  public static unknownShapeType(type: string): CommandError {
    return new CommandError(`unknown shape type: ${type} (is the plugin loaded?)`);
  }

  public static cannotUngroupComposite(id: string): CommandError {
    return new CommandError(`cannot ungroup composite shape: ${id}`);
  }

  public static cannotGroupIntoDescendant(id: string): CommandError {
    return new CommandError(`cannot group a container into its own descendant: ${id}`);
  }

  public static cannotUngroupTopLevel(id: string): CommandError {
    return new CommandError(`cannot ungroup top-level container: ${id}`);
  }

  public static scaleFactorMustBePositive(): CommandError {
    return new CommandError('scale factor must be positive');
  }

  public static cannotReadFile(path: string): CommandError {
    return new CommandError(`cannot read file: ${path}`);
  }

  public static cannotWriteFile(path: string): CommandError {
    return new CommandError(`cannot write file: ${path}`);
  }

  public static noDocument(): CommandError {
    return new CommandError("no document. use 'init' or 'read' first");
  }

  public static undoNotAllowedAfterIo(): CommandError {
    return new CommandError('undo not allowed after io command');
  }

  public static unknownAttribute(attribute: string): CommandError {
    return new CommandError(`unknown attribute: ${attribute}`);
  }

  public static unknownCommand(name: string): CommandError {
    return new CommandError(`unknown command: ${name}`);
  }

  public static invalidArguments(usage: string): CommandError {
    return new CommandError(`invalid arguments, usage: ${usage}`);
  }

  public static nothingToUndo(): CommandError {
    return new CommandError('nothing to undo');
  }

  public static nothingToRedo(): CommandError {
    return new CommandError('nothing to redo');
  }
}
