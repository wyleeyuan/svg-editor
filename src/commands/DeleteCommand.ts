import type { Document } from '../model/Document.js';
import type { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

/**
 * `delete <id>`：删除图形，容器连同全部子孙。
 *
 * 撤销需要还原"原来挂在哪个容器、第几个位置"，因此首次执行时记下 `parent` 与 `index`。
 * 对象本身不销毁，挂回去即可，无需重建子树。
 */
export class DeleteCommand extends Command {
  private readonly id: string;
  private shape: Shape | null = null;
  private parent: ContainerShape | null = null;
  private index = 0;

  public constructor(id: string) {
    super();
    this.id = id;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const shape = this.captureTarget(document);
    this.parent?.detach(shape);
    document.unregister(shape);
    return `${shape.typeName}#${shape.id} deleted`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    if (this.shape === null || this.parent === null) {
      return '';
    }
    // 子孙在被删时一并注销了，恢复时要整棵子树重新登记。
    this.shape.visit((node: Shape) => {
      if (!document.has(node.id)) {
        document.register(node);
      }
    });
    this.parent.insertAt(this.shape, Math.min(this.index, this.parent.childCount));
    return `${this.shape.typeName}#${this.shape.id} restored into ${this.describeParent()}`;
  }

  private captureTarget(document: Document): Shape {
    if (this.shape !== null) {
      return this.shape;
    }
    this.shape = document.require(this.id);
    this.parent = this.shape.parent;
    this.index = this.parent === null ? 0 : this.parent.children.indexOf(this.shape);
    return this.shape;
  }

  private describeParent(): string {
    const parent = this.parent;
    if (parent === null) {
      return 'svg';
    }
    return parent.id === 'svg' ? 'svg' : `g#${parent.id}`;
  }
}
