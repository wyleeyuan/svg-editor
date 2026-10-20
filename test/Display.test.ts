import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from './Driver.js';

describe('tree', () => {
  it('输出结构树并对齐属性列', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    driver.run('create rect a 0 0 10 10');
    driver.run('create g g1');
    driver.run('create circle c 5 5 2 in g1');

    expect(driver.run('tree')).toBe(
      [
        'svg (400x200)',
        '├── rect#a    x=0 y=0 w=10 h=10',
        '└── g#g1',
        '    └── circle#c  cx=5 cy=5 r=2',
      ].join('\n'),
    );
  });

  it('text 显示位置与引号内容，line 显示两端点', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    driver.run('create text t1 20 40 "My Diagram"');
    driver.run('create line e 0 0 10 10 black');

    const tree = driver.run('tree');
    expect(tree).toContain('(20,40) "My Diagram"');
    expect(tree).toContain('(0,0) -> (10,10)');
  });

  it('tree <id> 只显示子树', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    driver.run('create g g1');
    driver.run('create rect a 0 0 10 10 in g1');
    driver.run('create rect b 0 0 10 10');

    const subtree = driver.run('tree g1');
    expect(subtree.split('\n')[0]).toBe('g#g1');
    expect(subtree).toContain('rect#a');
    expect(subtree).not.toContain('rect#b');
  });

  it('不存在的 id 报 no such shape', () => {
    const driver = new Driver();
    driver.run('init 400 200');
    expect(() => driver.run('tree nope')).toThrow(/no such shape: nope/);
  });
});

describe('show', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect box 200 80 60 60 #3366ff');
    driver.run('create g markers');
    driver.run('create circle c1 100 100 20 red in markers');
  });

  it('输出类型、父容器与分行属性', () => {
    expect(driver.run('show c1')).toBe(
      ['circle#c1  parent=g#markers', '  cx=100 cy=100 r=20', '  fill=red'].join('\n'),
    );
  });

  it('顶层图形的父容器显示为 svg', () => {
    expect(driver.run('show box')).toBe(
      ['rect#box  parent=svg', '  x=200 y=80 width=60 height=60', '  fill=#3366ff'].join('\n'),
    );
  });

  it('容器只有首行', () => {
    expect(driver.run('show markers')).toBe('g#markers  parent=svg');
  });
});

describe('set', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create text title 20 40 "My Diagram"');
    driver.run('create rect r1 0 0 10 10');
  });

  it('修改文本内容并在回显中加引号', () => {
    expect(driver.run('set title text "My Diagram v2"')).toBe(
      'text#title updated: text="My Diagram v2"',
    );
    expect(driver.document.require('title').getAttr('text')).toBe('My Diagram v2');
  });

  it('修改几何属性与外观属性', () => {
    expect(driver.run('set r1 fill red')).toBe('rect#r1 updated: fill=red');
    expect(driver.run('set r1 width 20')).toBe('rect#r1 updated: width=20');
    expect(driver.document.require('r1').getAttr('width')).toBe('20');
  });

  it('白名单外的属性报 unknown attribute', () => {
    expect(() => driver.run('set title font-size 20')).toThrow(/unknown attribute: font-size/);
  });

  it('undo 还原旧值', () => {
    driver.run('set title text "v2"');
    expect(driver.run('undo')).toBe('text#title updated: text="My Diagram"');
    expect(driver.document.require('title').getAttr('text')).toBe('My Diagram');
  });

  it('非数值写入几何属性时报参数错误', () => {
    expect(() => driver.run('set r1 width abc')).toThrow(/invalid arguments/);
  });
});
