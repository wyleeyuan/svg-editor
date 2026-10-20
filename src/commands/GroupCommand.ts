import { CommandError } from '../model/CommandError.js';
import type { Document } from '../model/Document.js';
import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { Command } from './Command.js';
import type { Session } from './Session.js';

interface Placement {
  readonly shape: Shape;
  readonly parent: ContainerShape;
  readonly index: number;
}

/**
 * `group <newGid> <id1> <id2>…`：新建容器并把已有图形收进去。
 *
 * 子节点的次序**跟文档顺序走**，不跟参数顺序：SVG 的绘制次序就是文档次序，
 * 编组若按参数重排会静默改变 z-order，"保持相对顺序"要求的是前者。
 * 新容器占据「第一个被收编图形的原位置」，这样视觉上不会因为编组而跳到末尾。
 * 撤销时按原索引升序放回：已放回的兄弟一定在它前面，因此原始索引直接可用。
 */
export class GroupCommand extends Command {
  private readonly groupId: string;
  private readonly ids: readonly string[];
  private group: ContainerShape | null = null;
  private placements: Placement[] = [];

  public constructor(groupId: string, ids: readonly string[]) {
    super();
    this.groupId = groupId;
    this.ids = ids;
  }

  public override execute(session: Session): string {
    const document = session.requireDocument();
    const group = this.materialize(document);

    for (const placement of this.placements) {
      placement.parent.detach(placement.shape);
    }
    for (const placement of this.placements) {
      group.append(placement.shape);
    }

    const first = this.placements[0];
    if (first !== undefined) {
      first.parent.insertAt(group, Math.min(first.index, first.parent.childCount));
    }
    if (!document.has(group.id)) {
      document.register(group);
    }
    return `g#${group.id} created with ${Command.counted(group.childCount, 'child', 'children')}`;
  }

  public override undo(session: Session): string {
    const document = session.requireDocument();
    const group = this.group;
    if (group === null) {
      return '';
    }
    for (const placement of this.placements) {
      group.detach(placement.shape);
    }
    group.parent?.detach(group);
    document.unregister(group);

    for (const placement of [...this.placements].sort((a, b) => a.index - b.index)) {
      placement.parent.insertAt(
        placement.shape,
        Math.min(placement.index, placement.parent.childCount),
      );
    }
    return `g#${group.id} ungrouped`;
  }

  private materialize(document: Document): ContainerShape {
    if (this.group !== null) {
      return this.group;
    }
    if (document.has(this.groupId)) {
      throw CommandError.idExists(this.groupId);
    }
    this.placements = this.collect(document);
    this.group = new ContainerShape(this.groupId);
    return this.group;
  }

  private collect(document: Document): Placement[] {
    if (this.ids.length === 0) {
      throw CommandError.invalidArguments('group <newGid> <id1> <id2>…');
    }
    const seen = new Set<string>();
    for (const id of this.ids) {
      if (seen.has(id)) {
        throw CommandError.invalidArguments('group <newGid> <id1> <id2>…');
      }
      seen.add(id);
    }

    const shapes = this.ids.map((id) => document.require(id));
    GroupCommand.sortByDocumentOrder(document, shapes);
    for (const shape of shapes) {
      for (const other of shapes) {
        if (shape !== other && ContainerShape.isContainer(shape) && shape.contains(other)) {
          // 同时收编容器与其子孙会重复包含，报出容器本身（作业示例：markers）。
          throw CommandError.cannotGroupIntoDescendant(shape.id);
        }
      }
    }
    return shapes.map((shape) => {
      const parent = shape.parent;
      if (parent === null) {
        throw CommandError.noSuchShape(shape.id);
      }
      return { shape, parent, index: parent.children.indexOf(shape) };
    });
  }

  /** 按文档先序就地排序，保证编组不改动 z-order。 */
  private static sortByDocumentOrder(document: Document, shapes: Shape[]): void {
    const order = new Map<Shape, number>();
    document.elements().forEach((shape, index) => order.set(shape, index));
    shapes.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }
}
