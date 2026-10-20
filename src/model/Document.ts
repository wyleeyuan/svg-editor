import { ContainerShape } from '../shapes/ContainerShape.js';
import type { Shape } from '../shapes/Shape.js';
import { CommandError } from './CommandError.js';

/**
 * 当前文档：画布尺寸、一棵以 `svg` 为根的图形树、以及全文档的 id 索引。
 *
 * id 索引与树结构解耦——索引用"是否存在于文档中"作不变式，与父子关系无关。
 * 因此 `group` / `ungroup` / `addto` 这类只改结构、不改存在性的操作不碰索引，
 * 只有 `create`（注册）、`delete`（连同子孙注销）、`read`（批量注册）会动它。
 */
export class Document {
  private _width: number;
  private _height: number;
  private _path: string | null = null;
  private _loaded = false;
  private readonly _root: ContainerShape = new ContainerShape('svg');
  private readonly _index = new Map<string, Shape>();

  public constructor(width = 800, height = 600) {
    this._width = width;
    this._height = height;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  /** 虚拟根节点，id 固定为 `svg`，不参与 id 索引。 */
  public get root(): ContainerShape {
    return this._root;
  }

  /** 读入 / 保存对应的文件路径；`init` 出来的文档为 `null`。 */
  public get path(): string | null {
    return this._path;
  }

  public set path(value: string | null) {
    this._path = value;
  }

  /** 是否已经 `init` 或 `read` 过。未就绪时除 init/read 外的命令都应报错。 */
  public get loaded(): boolean {
    return this._loaded;
  }

  public lookup(id: string): Shape | undefined {
    return this._index.get(id);
  }

  /** 是否为虚拟根（顶层容器不允许 ungroup）。 */
  public isRoot(container: ContainerShape): boolean {
    return container === this._root;
  }

  public has(id: string): boolean {
    return id === this._root.id || this._index.has(id);
  }

  public require(id: string): Shape {
    const shape = this._index.get(id);
    if (shape === undefined) {
      throw CommandError.noSuchShape(id);
    }
    return shape;
  }

  public register(shape: Shape): void {
    if (this.has(shape.id)) {
      throw CommandError.idExists(shape.id);
    }
    this._index.set(shape.id, shape);
  }

  /** 注销整棵子树：`delete <g>` 会让容器与其全部子孙一起消失。 */
  public unregister(shape: Shape): void {
    shape.visit((node: Shape) => {
      this._index.delete(node.id);
    });
  }

  /** 挂到指定容器；id 未注册时顺便注册。 */
  public attach(shape: Shape, parent: ContainerShape, index: number): void {
    if (!this._index.has(shape.id)) {
      this.register(shape);
    }
    parent.insertAt(shape, index);
  }

  public resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
  }

  /** 丢弃当前内容，用于 `init` 与 `read`。 */
  public reset(width: number, height: number): void {
    for (const child of [...this._root.children]) {
      this._root.detach(child);
    }
    this._index.clear();
    this._width = width;
    this._height = height;
    this._path = null;
    this._loaded = true;
  }

  /** 文档中的全部图形（含容器），按树的先序排列；不含虚拟根。 */
  public elements(): readonly Shape[] {
    const all: Shape[] = [];
    for (const child of this._root.children) {
      child.visit((node: Shape) => all.push(node));
    }
    return all;
  }

  public get count(): number {
    return this._index.size;
  }
}
