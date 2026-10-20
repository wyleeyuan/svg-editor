import { Shape } from './Shape.js';

/**
 * 容器（`<g>`）：Composite 模式里的组合节点。
 *
 * 它对外的接口与叶子完全一致（`move` / `scale` / `setAttr`），差别只在内部实现——
 * 几何操作递归到子节点，因此上层代码不需要区分"这是容器还是图形"。
 *
 * 容器本身没有任何自有几何属性，只有子节点序列；`fill` / `stroke` 等外观属性由基类持有。
 */
export class ContainerShape extends Shape {
  private readonly _children: Shape[] = [];

  /** 类型收窄用的守卫：把「是不是容器」这个问题交给容器自己回答。 */
  public static isContainer(shape: Shape): shape is ContainerShape {
    return shape instanceof ContainerShape;
  }

  public constructor(id: string) {
    super(id);
  }

  public override get typeName(): string {
    return 'g';
  }

  public get children(): readonly Shape[] {
    return this._children;
  }

  public get childCount(): number {
    return this._children.length;
  }

  public override attributeNames(): readonly string[] {
    return [];
  }

  public override move(dx: number, dy: number): void {
    for (const child of this._children) {
      child.move(dx, dy);
    }
  }

  public override scale(factor: number): void {
    for (const child of this._children) {
      child.scale(factor);
    }
  }

  public override visit(visitor: (shape: Shape) => void): void {
    visitor(this);
    for (const child of this._children) {
      child.visit(visitor);
    }
  }

  public append(shape: Shape): void {
    this.insertAt(shape, this._children.length);
  }

  public insertAt(shape: Shape, index: number): void {
    if (shape.parent !== null) {
      throw new Error(`shape already attached: ${shape.id}`);
    }
    if (index < 0 || index > this._children.length) {
      throw new RangeError(`index out of range: ${index}`);
    }
    this._children.splice(index, 0, shape);
    shape.attachTo(this);
  }

  /** 摘出直接子节点，返回其原索引；不是直接子节点时返回 -1。 */
  public detach(shape: Shape): number {
    const index = this._children.indexOf(shape);
    if (index < 0) {
      return -1;
    }
    this._children.splice(index, 1);
    shape.attachTo(null);
    return index;
  }

  /** 容器在 tree 里只显示自己的 id，属性由子节点体现。 */
  public override describe(): string {
    return '';
  }

  /** 是否为 `candidate` 的祖先（用于拒绝把容器收进自己的子孙里）。 */
  public contains(candidate: Shape): boolean {
    let found = false;
    this.visit((shape: Shape) => {
      if (shape === candidate) {
        found = true;
      }
    });
    return found;
  }

  protected override getOwnAttr(): undefined {
    return undefined;
  }

  protected override setOwnAttr(): boolean {
    return false;
  }
}
