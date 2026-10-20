import { NumberText } from './NumberText.js';
import { Shape } from './Shape.js';

/** 线段：两端点坐标，没有宽高概念，缩放时两个端点一起乘。 */
export class LineShape extends Shape {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;

  public constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  public override get typeName(): string {
    return 'line';
  }

  public override attributeNames(): readonly string[] {
    return ['x1', 'y1', 'x2', 'y2'];
  }

  public override move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  public override scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  protected override getOwnAttr(name: string): string | undefined {
    switch (name) {
      case 'x1':
        return NumberText.format(this.x1);
      case 'y1':
        return NumberText.format(this.y1);
      case 'x2':
        return NumberText.format(this.x2);
      case 'y2':
        return NumberText.format(this.y2);
      default:
        return undefined;
    }
  }

  protected override setOwnAttr(name: string, value: string): boolean {
    switch (name) {
      case 'x1':
        this.x1 = NumberText.parse(value);
        return true;
      case 'y1':
        this.y1 = NumberText.parse(value);
        return true;
      case 'x2':
        this.x2 = NumberText.parse(value);
        return true;
      case 'y2':
        this.y2 = NumberText.parse(value);
        return true;
      default:
        return false;
    }
  }
}
