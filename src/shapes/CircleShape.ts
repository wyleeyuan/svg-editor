import { NumberText } from './NumberText.js';
import { Shape, type Point } from './Shape.js';

/** 圆：以圆心为锚点，`cx` / `cy` / `r` 三个几何属性。 */
export class CircleShape extends Shape {
  private cx: number;
  private cy: number;
  private radius: number;

  public constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
  }

  public override get typeName(): string {
    return 'circle';
  }

  public override attributeNames(): readonly string[] {
    return ['cx', 'cy', 'r'];
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  public override get anchor(): Point | null {
    return { x: this.cx, y: this.cy };
  }

  protected override getOwnAttr(name: string): string | undefined {
    switch (name) {
      case 'cx':
        return NumberText.format(this.cx);
      case 'cy':
        return NumberText.format(this.cy);
      case 'r':
        return NumberText.format(this.radius);
      default:
        return undefined;
    }
  }

  protected override setOwnAttr(name: string, value: string): boolean {
    switch (name) {
      case 'cx':
        this.cx = NumberText.parse(value);
        return true;
      case 'cy':
        this.cy = NumberText.parse(value);
        return true;
      case 'r':
        this.radius = NumberText.parse(value);
        return true;
      default:
        return false;
    }
  }
}
