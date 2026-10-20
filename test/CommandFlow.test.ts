import { beforeEach, describe, expect, it } from 'vitest';

import { Session } from '../src/commands/Session.js';
import { CommandRegistry } from '../src/cli/CommandRegistry.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';

/** 直接在测试里驱动命令链路，不启动 REPL。 */
class Driver {
  private readonly session = new Session();
  private readonly registry = new CommandRegistry();
  private readonly tokenizer = new Tokenizer();

  public run(line: string): string {
    const command = this.registry.build(this.tokenizer.tokenize(line));
    return this.session.history.run(command, this.session);
  }

  public undo(): string {
    return this.session.history.undo(this.session);
  }

  public redo(): string {
    return this.session.history.redo(this.session);
  }

  public get document(): Session['document'] {
    return this.session.document;
  }
}

describe('Tokenizer', () => {
  it('按空白切分并保留引号内的空格', () => {
    const tokenizer = new Tokenizer();
    expect(tokenizer.tokenize('create text t1 20 40 "My Diagram"')).toEqual([
      'create',
      'text',
      't1',
      '20',
      '40',
      'My Diagram',
    ]);
  });

  it('支持空字符串参数与转义引号', () => {
    const tokenizer = new Tokenizer();
    expect(tokenizer.tokenize('create text t1 0 0 ""')).toEqual([
      'create',
      'text',
      't1',
      '0',
      '0',
      '',
    ]);
    expect(tokenizer.tokenize('create text t1 0 0 "a\\"b"')).toEqual([
      'create',
      'text',
      't1',
      '0',
      '0',
      'a"b',
    ]);
  });

  it('引号未闭合时报错', () => {
    expect(() => new Tokenizer().tokenize('create text t1 0 0 "oops')).toThrow(
      /unterminated quoted string/,
    );
  });
});

describe('文档生命周期', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
  });

  it('未 init / read 时命令报 no document', () => {
    expect(() => driver.run('create rect r1 0 0 10 10')).toThrow(
      /no document\. use 'init' or 'read' first/,
    );
  });

  it('init 建立画布并允许后续编辑', () => {
    expect(driver.run('init 400 200')).toBe('canvas 400x200 created');
    expect(driver.document.width).toBe(400);
    expect(driver.document.height).toBe(200);
    expect(driver.run('create rect r1 0 0 10 10')).toBe('rect#r1 created');
  });

  it('init 省略尺寸时用 800x600', () => {
    expect(driver.run('init')).toBe('canvas 800x600 created');
  });

  it('未知命令报 unknown command', () => {
    expect(() => driver.run('frobnicate')).toThrow(/unknown command: frobnicate/);
  });
});

describe('create', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
  });

  it('创建各类图形并写入可选外观', () => {
    expect(driver.run('create rect bg 0 0 800 600 #ffffff')).toBe('rect#bg created');
    expect(driver.document.require('bg').getAttr('fill')).toBe('#ffffff');

    expect(driver.run('create circle c1 100 100 20 red')).toBe('circle#c1 created');
    expect(driver.document.require('c1').getAttr('fill')).toBe('red');

    expect(driver.run('create text t1 20 40 "My Diagram"')).toBe('text#t1 created');
    expect(driver.document.require('t1').getAttr('text')).toBe('My Diagram');
  });

  it('in 子句把图形挂进容器', () => {
    driver.run('create g node1');
    expect(driver.run('create rect start 120 100 160 60 #4a90d9 in node1')).toBe(
      'rect#start created in g#node1',
    );
    const parent = driver.document.require('start').parent;
    expect(parent?.id).toBe('node1');
  });

  it('重复 id 被拒绝', () => {
    driver.run('create rect r1 0 0 10 10');
    expect(() => driver.run('create circle r1 0 0 5')).toThrow(/id already exists: r1/);
  });

  it('in 目标不存在或不是容器时分别报错', () => {
    expect(() => driver.run('create rect r1 0 0 1 1 in nope')).toThrow(/no such container: nope/);
    driver.run('create rect box 0 0 1 1');
    expect(() => driver.run('create rect r2 0 0 1 1 in box')).toThrow(/not a container: box/);
  });

  it('未知图形类型报 unknown shape type', () => {
    expect(() => driver.run('create hexagon h1 0 0')).toThrow(/unknown shape type: hexagon/);
  });

  it('参数不足时报参数错误', () => {
    expect(() => driver.run('create rect r1 0 0')).toThrow(/invalid arguments/);
  });
});

describe('move / scale 与撤销', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 10 20 100 50');
  });

  it('move 回显目标坐标，undo 精确还原', () => {
    expect(driver.run('move r1 5 5')).toBe('rect#r1 moved to (15,25)');
    expect(driver.undo()).toBe('rect#r1 moved back to (10,20)');
    expect(driver.document.require('r1').getAttr('x')).toBe('10');
  });

  it('浮点增量也能精确还原', () => {
    driver.run('move r1 0.1 0');
    driver.run('move r1 0.2 0');
    driver.undo();
    driver.undo();
    expect(driver.document.require('r1').getAttr('x')).toBe('10');
  });

  it('容器 move 用增量描述，子节点同步平移', () => {
    driver.run('create g g1');
    driver.run('create rect child 0 0 10 10 in g1');
    expect(driver.run('move g1 0 100')).toBe('g#g1 moved by (0,100)');
    expect(driver.document.require('child').getAttr('y')).toBe('100');
    expect(driver.undo()).toBe('g#g1 moved back by (0,-100)');
    expect(driver.document.require('child').getAttr('y')).toBe('0');
  });

  it('scale 缩放位置与尺寸，undo 还原', () => {
    expect(driver.run('scale r1 2')).toBe('rect#r1 scaled by 2');
    expect(driver.document.require('r1').getAttr('width')).toBe('200');
    expect(driver.undo()).toBe('rect#r1 scaled back');
    expect(driver.document.require('r1').getAttr('width')).toBe('100');
  });

  it('非正数因子被拒绝', () => {
    expect(() => driver.run('scale r1 0')).toThrow(/scale factor must be positive/);
  });
});

describe('undo / redo 语义', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 10 10');
  });

  it('io 命令后禁止 undo，下一次编辑命令重新解禁', () => {
    driver.run('init 800 600');
    expect(() => driver.undo()).toThrow(/undo not allowed after io command/);
    driver.run('create rect r2 0 0 10 10');
    expect(driver.undo()).toBe('rect#r2 removed');
  });

  it('undo 后新编辑清空 redo 栈', () => {
    driver.run('move r1 5 5');
    driver.undo();
    driver.run('move r1 1 1');
    expect(() => driver.redo()).toThrow(/nothing to redo/);
  });
});
