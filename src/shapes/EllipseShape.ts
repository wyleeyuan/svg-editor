import { NumberText } from './NumberText.js';
import { Shape, type Point } from './Shape.js';

/** 椭圆：`cx` / `cy` / `rx` / `ry`，两个半径分别缩放。 */
export class EllipseShape extends Shape {
  private cx: number;
  private cy: number;
  private radiusX: number;
  private radiusY: number;

  public constructor(id: string, cx: number, cy: number, radiusX: number, radiusY: number) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.radiusX = radiusX;
    this.radiusY = radiusY;
  }

  public override get typeName(): string {
    return 'ellipse';
  }

  public override attributeNames(): readonly string[] {
    return ['cx', 'cy', 'rx', 'ry'];
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radiusX *= factor;
    this.radiusY *= factor;
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
      case 'rx':
        return NumberText.format(this.radiusX);
      case 'ry':
        return NumberText.format(this.radiusY);
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
      case 'rx':
        this.radiusX = NumberText.parse(value);
        return true;
      case 'ry':
        this.radiusY = NumberText.parse(value);
        return true;
      default:
        return false;
    }
  }
}
