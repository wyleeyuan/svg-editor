import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Driver } from './Driver.js';

const FIXTURE = 'test/fixtures/other.svg';

describe('read', () => {
  it('读入文件、补齐缺 id 并打印警告', () => {
    const driver = new Driver();
    const output = driver.run(`read ${FIXTURE}`);

    expect(output).toBe(
      ['warning: assigned id rect1 to unnamed <rect>', `read ${FIXTURE} (7 elements)`].join('\n'),
    );
    expect(driver.document.width).toBe(400);
    expect(driver.document.height).toBe(300);
    expect(driver.document.require('rect1').getAttr('fill')).toBe('#ffffff');
  });

  it('保持同级元素的原始顺序', () => {
    const driver = new Driver();
    driver.run(`read ${FIXTURE}`);
    expect(driver.document.root.children.map((child) => child.id)).toEqual([
      'rect1',
      't1',
      'c1',
      'g1',
      'e1',
    ]);
  });

  it('文本内容作为元素体读回', () => {
    const driver = new Driver();
    driver.run(`read ${FIXTURE}`);
    expect(driver.document.require('t1').getAttr('text')).toBe('imported');
  });

  it('文件不存在时报 cannot read file', () => {
    const driver = new Driver();
    expect(() => driver.run('read nope.svg')).toThrow(/cannot read file: nope.svg/);
  });

  it('读入后 undo 被禁止', () => {
    const driver = new Driver();
    driver.run(`read ${FIXTURE}`);
    expect(() => driver.run('undo')).toThrow(/undo not allowed after io command/);
  });

  it('尺寸与属性带 px 单位时按数值读入', () => {
    const directory = mkdtempSync(join(tmpdir(), 'svg-editor-px-'));
    const target = join(directory, 'px.svg');
    writeFileSync(
      target,
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="320px" height="240px">',
        '  <rect id="r1" x="10px" y="20" width="30px" height="40"/>',
        '</svg>',
      ].join('\n'),
      'utf8',
    );

    const driver = new Driver();
    expect(driver.run(`read ${target}`)).toBe(`read ${target} (1 element)`);
    expect(driver.document.width).toBe(320);
    expect(driver.document.height).toBe(240);
    expect(driver.document.require('r1').getAttr('width')).toBe('30');
    rmSync(directory, { recursive: true, force: true });
  });

  it('属性值不是数字时报参数错误而不是写坏数据', () => {
    const directory = mkdtempSync(join(tmpdir(), 'svg-editor-bad-'));
    const target = join(directory, 'percent.svg');
    writeFileSync(
      target,
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect id="r1" width="50%"/></svg>',
      'utf8',
    );

    const driver = new Driver();
    expect(() => driver.run(`read ${target}`)).toThrow(/invalid arguments/);
    rmSync(directory, { recursive: true, force: true });
  });
});

describe('save', () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'svg-editor-'));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it('写出可被再次读入的 SVG', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    driver.run('create rect r1 10 20 100 50 #eee');
    driver.run('create text t1 20 40 "My Diagram"');
    driver.run('create g g1');
    driver.run('create circle c1 100 100 20 red in g1');

    const target = join(directory, 'demo.svg');
    expect(driver.run(`save ${target}`)).toBe(`saved to ${target} (4 elements)`);

    const content = readFileSync(target, 'utf8');
    expect(content).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"');
    expect(content).toContain('<rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>');
    expect(content).toContain('<text id="t1" x="20" y="40">My Diagram</text>');
    expect(content).toContain('<g id="g1">');
  });

  it('只有一个图形时数量短语用单数', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create rect r1 0 0 10 10');
    const target = join(directory, 'one.svg');
    expect(driver.run(`save ${target}`)).toBe(`saved to ${target} (1 element)`);
    expect(driver.run(`read ${target}`)).toBe(`read ${target} (1 element)`);
  });

  it('round-trip 后结构与属性完全一致', () => {
    const first = new Driver();
    first.run(`read ${FIXTURE}`);
    const target = join(directory, 'round.svg');
    first.run(`save ${target}`);
    const before = first.run('tree');

    const second = new Driver();
    second.run(`read ${target}`);
    expect(second.run('tree')).toBe(before);
  });

  it('保存后沿用路径，省略参数可再次写入', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    const target = join(directory, 'again.svg');
    driver.run(`save ${target}`);
    expect(driver.run('save')).toBe(`saved to ${target} (0 elements)`);
  });

  it('init 出来的文档省略路径时报参数错误', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    expect(() => driver.run('save')).toThrow(/invalid arguments/);
  });

  it('保存后 undo 被禁止，下一次编辑解禁', () => {
    const driver = new Driver();
    driver.run('init 100 100');
    driver.run('create rect r1 0 0 10 10');
    driver.run(`save ${join(directory, 'x.svg')}`);
    expect(() => driver.run('undo')).toThrow(/undo not allowed after io command/);
    driver.run('move r1 1 1');
    expect(driver.run('undo')).toBe('rect#r1 moved back to (0,0)');
  });
});

describe('canvas', () => {
  it('无参数显示尺寸', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(driver.run('canvas')).toBe('canvas 800x600');
  });

  it('带参数修改尺寸并锁定 undo', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect r1 0 0 10 10');
    expect(driver.run('canvas 400 300')).toBe('canvas 400x300');
    expect(driver.document.width).toBe(400);
    expect(() => driver.run('undo')).toThrow(/undo not allowed after io command/);
  });

  it('只给一个参数时报参数错误', () => {
    const driver = new Driver();
    driver.run('init 800 600');
    expect(() => driver.run('canvas 400')).toThrow(/invalid arguments/);
  });
});
