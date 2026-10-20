import { NumberText } from './NumberText.js';
import { Shape, type Point } from './Shape.js';

/** 矩形：以左上角为锚点，`x` / `y` / `width` / `height` 四个几何属性。 */
export class RectShape extends Shape {
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  public constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public override get typeName(): string {
    return 'rect';
  }

  public override attributeNames(): readonly string[] {
    return ['x', 'y', 'width', 'height'];
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  public override get anchor(): Point | null {
    return { x: this.x, y: this.y };
  }

  protected override getOwnAttr(name: string): string | undefined {
    switch (name) {
      case 'x':
        return NumberText.format(this.x);
      case 'y':
        return NumberText.format(this.y);
      case 'width':
        return NumberText.format(this.width);
      case 'height':
        return NumberText.format(this.height);
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
      case 'width':
        this.width = NumberText.parse(value);
        return true;
      case 'height':
        this.height = NumberText.parse(value);
        return true;
      default:
        return false;
    }
  }
}
