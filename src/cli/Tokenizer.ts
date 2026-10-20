import { CommandError } from '../model/CommandError.js';

/**
 * 命令行分词：空白分隔，双引号包住的内容算一个 token（主要给 text 内容用）。
 *
 * `#` 注释在 REPL 层按行首处理，这里不碰——因为颜色值 `#4a90d9` 也以 `#` 开头。
 */
export class Tokenizer {
  public tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let quoted = false;
    let started = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (quoted) {
        if (char === '\\' && line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          current += char;
        }
        continue;
      }

      if (char === '"') {
        quoted = true;
        started = true;
        continue;
      }

      if (char === ' ' || char === '\t') {
        if (started) {
          tokens.push(current);
          current = '';
          started = false;
        }
        continue;
      }

      current += char;
      started = true;
    }

    if (quoted) {
      throw new CommandError('unterminated quoted string');
    }
    if (started) {
      tokens.push(current);
    }
    return tokens;
  }
}
