import type { ContainerShape } from './ContainerShape.js';
import { NumberText } from './NumberText.js';

/**
 * 单个图形的属性快照。
 *
 * 只记录**自身属性**，不含父子结构与兄弟顺序——结构变化（delete / group / addto）
 * 由命令层记录父容器与索引来完成，因为撤销时对象仍然存活，重新挂载即可，无需深拷贝子树。
 */
export interface ShapeState {
  readonly attrs: ReadonlyArray<readonly [string, string]>;
  /** 仅 `text` 元素使用：内容是元素文本，不在属性表里。 */
  readonly text?: string;
}

/**
 * 所有图形的抽象基类。
 *
 * 基类只承担三件与具体形状无关的事：身份（id）、归属（父容器）、外观（fill / stroke /
 * stroke-width）。几何属性与几何行为（`move` / `scale`）留给子类多态实现，
 * 这样容器与叶子对外是同一个接口，内部各自演化。
 */
export abstract class Shape {
  private readonly _id: string;
  private _parent: ContainerShape | null = null;
  private _fill: string | null = null;
  private _stroke: string | null = null;
  private _strokeWidth: number | null = null;

  protected constructor(id: string) {
    if (id === '') {
      throw new Error('shape id must not be empty');
    }
    this._id = id;
  }

  public get id(): string {
    return this._id;
  }

  public get parent(): ContainerShape | null {
    return this._parent;
  }

  /** 由容器在挂载 / 摘出时调用，外部不要直接改父指针。 */
  public attachTo(parent: ContainerShape | null): void {
    this._parent = parent;
  }

  /** SVG 标签名，同时也是序列化时的元素名。 */
  public abstract get typeName(): string;

  /** 该类独有的几何属性名，按输出顺序返回；外观属性由基类统一追加。 */
  public abstract attributeNames(): readonly string[];

  /** 平移；容器会递归到子孙。 */
  public abstract move(dx: number, dy: number): void;

  /** 等比缩放：位置与尺寸同乘 factor；容器递归到子孙。 */
  public abstract scale(factor: number): void;

  /**
   * 深度优先遍历自身与全部子孙，用于查找、计数、序列化等需要走整棵子树的场合。
   * 叶子只访问自身；容器覆写为递归，从而避免上层写 `instanceof` 分支。
   */
  public visit(visitor: (shape: Shape) => void): void {
    visitor(this);
  }

  public getAttr(name: string): string | undefined {
    switch (name) {
      case 'fill':
        return this._fill ?? undefined;
      case 'stroke':
        return this._stroke ?? undefined;
      case 'stroke-width':
        return this._strokeWidth === null ? undefined : NumberText.format(this._strokeWidth);
      default:
        return this.getOwnAttr(name);
    }
  }

  /**
   * 设置属性，返回是否被本类接受。
   * 返回 `false` 表示不在白名单内，由上层输出 `error: unknown attribute: <attr>`。
   */
  public setAttr(name: string, value: string): boolean {
    switch (name) {
      case 'fill':
        this._fill = value;
        return true;
      case 'stroke':
        this._stroke = value;
        return true;
      case 'stroke-width':
        this._strokeWidth = NumberText.parse(value);
        return true;
      default:
        return this.setOwnAttr(name, value);
    }
  }

  /** 已设置的属性对，按「几何 → 外观」顺序排列，用于序列化与树形展示。 */
  public attributePairs(): ReadonlyArray<readonly [string, string]> {
    const pairs: [string, string][] = [];
    for (const name of [...this.attributeNames(), 'fill', 'stroke', 'stroke-width']) {
      const value = this.getAttr(name);
      if (value !== undefined) {
        pairs.push([name, value]);
      }
    }
    return pairs;
  }

  public snapshot(): ShapeState {
    return { attrs: this.attributePairs() };
  }

  public restore(state: ShapeState): void {
    this._fill = null;
    this._stroke = null;
    this._strokeWidth = null;
    for (const [name, value] of state.attrs) {
      this.setAttr(name, value);
    }
  }

  /** 子类返回自己的几何属性；不认识的名字返回 `undefined`。 */
  protected abstract getOwnAttr(name: string): string | undefined;

  /** 子类处理自己的几何属性；不认识的名字返回 `false`。 */
  protected abstract setOwnAttr(name: string, value: string): boolean;
}
