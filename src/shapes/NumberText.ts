/**
 * 数值与 SVG 属性文本之间的转换。
 *
 * 浮点运算会产生 `99.99999999999999` 这类值，直接写进 SVG 既不美观也让 round-trip
 * 比对变难，因此统一在这里收敛：最多 3 位小数，去掉尾随零。
 */
export class NumberText {
  private static readonly SCALE = 1000;

  /** 数值 → 属性文本，例如 `10` / `12.5` / `-3`。 */
  public static format(value: number): string {
    if (!Number.isFinite(value)) {
      throw new RangeError(`cannot format non-finite number: ${String(value)}`);
    }
    const rounded = Math.round(value * NumberText.SCALE) / NumberText.SCALE;
    // `String(-0)` 得到 "0"，正好符合 SVG 习惯，无需额外处理。
    return String(rounded);
  }

  /** 属性文本 → 数值；非数字抛错，由调用方决定如何转成 `error:` 输出。 */
  public static parse(text: string): number {
    const value = Number(text);
    if (!Number.isFinite(value)) {
      throw new RangeError(`not a number: ${text}`);
    }
    return value;
  }
}
