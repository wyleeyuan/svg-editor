import { NumberText } from './NumberText.js';
import { Shape } from './Shape.js';
import type { ShapeState } from './Shape.js';

/** 文本：位置在 `x` / `y`，内容不是属性而是元素文本，序列化时为子文本。 */
export class TextShape extends Shape {
  private x: number;
  private y: number;
  private content: string;

  public constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.x = x;
    this.y = y;
    this.content = content;
  }

  public override get typeName(): string {
    return 'text';
  }

  public get text(): string {
    return this.content;
  }

  public override attributeNames(): readonly string[] {
    return ['x', 'y', 'text'];
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /**
   * 只缩放锚点，不改字号：作业的 `set` 白名单里没有 `font-size`，
   * 文字尺寸本阶段不作为几何属性参与缩放。
   */
  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  public override snapshot(): ShapeState {
    return { ...super.snapshot(), text: this.content };
  }

  public override restore(state: ShapeState): void {
    super.restore(state);
    if (state.text !== undefined) {
      this.content = state.text;
    }
  }

  protected override getOwnAttr(name: string): string | undefined {
    switch (name) {
      case 'x':
        return NumberText.format(this.x);
      case 'y':
        return NumberText.format(this.y);
      case 'text':
        return this.content;
      default:
        return undefined;
    }
  }

  protected override setOwnAttr(name: string, value: string): boolean {
    switch (name) {
      case 'x':
        this.x = NumberText.parse(value);
        return true;
      case 'y':
        this.y = NumberText.parse(value);
        return true;
      case 'text':
        this.content = value;
        return true;
      default:
        return false;
    }
  }
}
