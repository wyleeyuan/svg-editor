import { describe, expect, it } from 'vitest';

import { Driver } from './Driver.js';

/**
 * 逐条锁定作业 4.2 的错误信息。
 *
 * 断言的是 **消息体**：`error:` 前缀由输出层（REPL）统一添加，
 * 命令层不重复带前缀，否则会出现 `error: error: ...`。
 */
describe('错误信息契约', () => {
  it('id 已存在', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 1 1');
    expect(() => driver.run('create circle r1 0 0 1')).toThrow(/^id already exists: r1$/);
  });

  it('id 不存在', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('show r9')).toThrow(/^no such shape: r9$/);
  });

  it('in 目标不存在', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('create rect r1 0 0 1 1 in node9')).toThrow(
      /^no such container: node9$/,
    );
  });

  it('in 目标不是容器', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect start 0 0 1 1');
    expect(() => driver.run('create rect r2 0 0 1 1 in start')).toThrow(/^not a container: start$/);
  });

  it('未注册的图形类型', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('create hexagon h1 0 0')).toThrow(
      /^unknown shape type: hexagon \(is the plugin loaded\?\)$/,
    );
  });

  it('group 自包含', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g g1');
    driver.run('create rect r1 0 0 1 1 in g1');
    expect(() => driver.run('group bad r1 g1')).toThrow(
      /^cannot group a container into its own descendant: g1$/,
    );
  });

  it('ungroup 顶层容器', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g scene');
    expect(() => driver.run('ungroup scene')).toThrow(
      /^cannot ungroup top-level container: scene$/,
    );
  });

  it('scale 非正数', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 1 1');
    expect(() => driver.run('scale r1 0')).toThrow(/^scale factor must be positive$/);
    expect(() => driver.run('scale r1 -1')).toThrow(/^scale factor must be positive$/);
  });

  it('文件不可读', () => {
    const driver = new Driver();
    expect(() => driver.run('read missing.svg')).toThrow(/^cannot read file: missing\.svg$/);
  });

  it('文件不可写', () => {
    const driver = new Driver();
    driver.run('init 10 10');
    expect(() => driver.run('save /no-such-directory-xyz/out.svg')).toThrow(
      /^cannot write file: \/no-such-directory-xyz\/out\.svg$/,
    );
  });

  it('未 read/init 就执行命令', () => {
    const driver = new Driver();
    expect(() => driver.run('move r1 1 1')).toThrow(/^no document\. use 'init' or 'read' first$/);
  });

  it('io 命令后 undo', () => {
    const driver = new Driver();
    driver.run('init 10 10');
    expect(() => driver.run('undo')).toThrow(/^undo not allowed after io command$/);
  });

  it('白名单外属性', () => {
    const driver = new Driver();
    driver.run('init 10 10');
    driver.run('create rect r1 0 0 1 1');
    expect(() => driver.run('set r1 opacity 0.5')).toThrow(/^unknown attribute: opacity$/);
  });

  it('未知命令', () => {
    const driver = new Driver();
    expect(() => driver.run('frobnicate')).toThrow(/^unknown command: frobnicate$/);
  });
});

describe('边界用例', () => {
  it('删除容器后 undo 恢复整棵子树，索引同步', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g g1');
    driver.run('create rect a 0 0 1 1 in g1');
    driver.run('create circle b 5 5 2 in g1');

    driver.run('delete g1');
    expect(driver.document.lookup('a')).toBeUndefined();
    expect(driver.document.lookup('b')).toBeUndefined();

    driver.run('undo');
    expect(driver.document.require('g1').childCount).toBe(2);
    expect(driver.document.require('a').parent?.id).toBe('g1');
  });

  it('空文档可以保存', () => {
    const driver = new Driver();
    driver.run('init 100 50');
    expect(driver.run('canvas')).toBe('canvas 100x50');
    expect(driver.document.count).toBe(0);
  });

  it('三级嵌套容器的 scale 递归到底', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g outer');
    driver.run('create g middle in outer');
    driver.run('create g inner in middle');
    driver.run('create rect leaf 10 10 20 20 in inner');

    driver.run('scale outer 2');
    expect(driver.document.require('leaf').getAttr('x')).toBe('20');
    expect(driver.document.require('leaf').getAttr('width')).toBe('40');

    driver.run('undo');
    expect(driver.document.require('leaf').getAttr('x')).toBe('10');
  });

  it('文本可以设为空字符串', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create text t1 0 0 "x"');
    expect(driver.run('set t1 text ""')).toBe('text#t1 updated: text=""');
    expect(driver.document.require('t1').getAttr('text')).toBe('');
  });

  it('删除兄弟后 undo 仍回到原顺序', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create rect a 0 0 1 1');
    driver.run('create rect b 0 0 1 1');
    driver.run('create rect c 0 0 1 1');
    driver.run('delete b');
    driver.run('undo');
    expect(driver.document.root.children.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});
