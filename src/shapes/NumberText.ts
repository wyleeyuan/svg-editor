/**
 * 数值与 SVG 属性文本之间的转换。
 *
 * 两件事在这里收敛：
 *
 * 1. **输出**：浮点运算会产生 `99.99999999999999` 这类值，直接写进 SVG 既不美观也让
 *    round-trip 比对变难，因此最多 3 位小数、去掉尾随零；
 * 2. **输入**：只接受十进制字面量与可选的 `px` 后缀。不用裸 `Number()` 是因为它太宽容——
 *    `Number('')` 与 `Number('  ')` 都等于 0，`Number('0x10')` 等于 16，用户少打一个参数
 *    会被静默当成 0，而外部 SVG 里的 `width="800px"` 又会被判成非法。
 */
export class NumberText {
  private static readonly SCALE = 1000;

  /** 十进制字面量（可带指数）与可选的 `px` 后缀；不认 `%`、`pt` 这类相对或物理单位。 */
  private static readonly NUMERIC = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:px)?$/i;

  /** 数值 → 属性文本，例如 `10` / `12.5` / `-3`。 */
  public static format(value: number): string {
    if (!Number.isFinite(value)) {
      throw new RangeError(`cannot format non-finite number: ${String(value)}`);
    }
    const rounded = Math.round(value * NumberText.SCALE) / NumberText.SCALE;
    // `String(-0)` 得到 "0"，正好符合 SVG 习惯，无需额外处理。
    return String(rounded);
  }

  /** 属性文本 → 数值；不合法时返回 `null`，由调用方决定是报错还是回退。 */
  public static tryParse(text: string): number | null {
    const trimmed = text.trim();
    if (!NumberText.NUMERIC.test(trimmed)) {
      return null;
    }
    const literal = trimmed.toLowerCase().endsWith('px') ? trimmed.slice(0, -2) : trimmed;
    const value = Number(literal);
    return Number.isFinite(value) ? value : null;
  }

  /** 属性文本 → 数值；不合法抛错，由调用方决定如何转成 `error:` 输出。 */
  public static parse(text: string): number {
    const value = NumberText.tryParse(text);
    if (value === null) {
      throw new RangeError(`not a number: ${text}`);
    }
    return value;
  }
}
