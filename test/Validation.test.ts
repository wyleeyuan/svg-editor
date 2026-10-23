import { describe, expect, it } from 'vitest';

import { Driver } from './Driver.js';

/**
 * 输入校验：把「被静默接受」的坏输入挡在命令层。
 *
 * 这些用例针对的是同一类问题——**错误输入不报错、悄悄做了一件别的事**：
 * 空字符串被当成 0、多打的参数被丢掉、0×0 的画布能存成非法 SVG。
 */
describe('数值解析', () => {
  it('空字符串不是 0', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('create rect r1 "" "" 10 10')).toThrow(/^invalid arguments/);
    expect(driver.document.lookup('r1')).toBeUndefined();
  });

  it('set 与 move 同样拒绝空值', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 10 10');
    expect(() => driver.run('set r1 x ""')).toThrow(/^invalid arguments, usage: set /);
    expect(() => driver.run('move r1 "" 0')).toThrow(/^invalid arguments, usage: move /);
    expect(driver.document.require('r1').getAttr('x')).toBe('0');
  });

  it('接受十进制、指数与 px 后缀', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(driver.run('create rect r1 10px 1e2 -3.5 .5')).toBe('rect#r1 created');
    expect(driver.document.require('r1').getAttr('x')).toBe('10');
    expect(driver.document.require('r1').getAttr('y')).toBe('100');
    expect(driver.document.require('r1').getAttr('width')).toBe('-3.5');
    expect(driver.document.require('r1').getAttr('height')).toBe('0.5');
  });

  it('拒绝十六进制与空白的近似值', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 10 10');
    expect(() => driver.run('set r1 x 0x10')).toThrow(/^invalid arguments/);
    expect(() => driver.run('set r1 x "  "')).toThrow(/^invalid arguments/);
  });
});

describe('画布尺寸', () => {
  it('init 与 canvas 拒绝 0 与负数', () => {
    const driver = new Driver();
    expect(() => driver.run('init 0 0')).toThrow(/^invalid arguments, usage: init /);
    driver.run('init 800 600');
    expect(() => driver.run('canvas 0 600')).toThrow(/^invalid arguments, usage: canvas /);
    expect(() => driver.run('canvas 800 -1')).toThrow(/^invalid arguments, usage: canvas /);
    expect(driver.run('canvas')).toBe('canvas 800x600');
  });

  it('失败后仍可继续编辑，撤销栈不受影响', () => {
    const driver = new Driver();
    driver.run('init 400 300');
    driver.run('create rect a 0 0 1 1');
    expect(() => driver.run('canvas 0 0')).toThrow();
    expect(driver.run('undo')).toBe('rect#a removed');
  });
});

describe('参数个数', () => {
  it('多打的参数不再被静默丢弃', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 1 1');
    expect(() => driver.run('delete r1 r2')).toThrow(/^invalid arguments, usage: delete <id>$/);
    expect(() => driver.run('save a.svg b.svg')).toThrow(
      /^invalid arguments, usage: save \[file\.svg\]$/,
    );
    expect(() => driver.run('set r1 x 1 2')).toThrow(/^invalid arguments, usage: set /);
    expect(() => driver.run('tree r1 r2')).toThrow(/^invalid arguments, usage: tree \[id\]$/);
    expect(() => driver.run('show r1 r2')).toThrow(/^invalid arguments, usage: show <id>$/);
    expect(() => driver.run('undo now')).toThrow(/^invalid arguments, usage: undo$/);
  });

  it('create 按类型限制参数个数', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('create rect r1 0 0 1 1 red extra')).toThrow(/^invalid arguments/);
    expect(() => driver.run('create g g1 extra')).toThrow(/^invalid arguments/);
    expect(driver.document.count).toBe(0);
  });

  it('create 的类型不认识时仍报 unknown shape type', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('create hexagon h 1 2 3 4 5 6 7 8')).toThrow(
      /^unknown shape type: hexagon/,
    );
  });

  it('in 子句只认倒数第二个词，文本内容可以是 "in"', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    driver.run('create g g1');
    expect(driver.run('create text t1 10 20 "in"')).toBe('text#t1 created');
    expect(driver.document.require('t1').getAttr('text')).toBe('in');
    expect(driver.run('create text t2 10 40 "in" in g1')).toBe('text#t2 created in g#g1');
    expect(driver.document.require('t2').parent?.id).toBe('g1');
  });
});

describe('空属性值', () => {
  it('非 text 属性不接受空值', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create rect r1 0 0 10 10');
    expect(() => driver.run('set r1 fill ""')).toThrow(/^invalid arguments, usage: set /);
    expect(driver.document.require('r1').getAttr('fill')).toBeUndefined();
  });

  it('text 内容允许清空', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create text t1 0 0 "x"');
    expect(driver.run('set t1 text ""')).toBe('text#t1 updated: text=""');
  });
});
