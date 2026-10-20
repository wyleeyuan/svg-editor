import { beforeEach, describe, expect, it } from 'vitest';

import { Driver } from './Driver.js';

/** 按作业 6.1 的会话搭出两节点流程图的结构（不含 set）。 */
class FlowFixture {
  public readonly driver = new Driver();

  public constructor() {
    this.driver.run('init 800 600');
    this.driver.run('create g flowchart');
    this.driver.run('create g node1 in flowchart');
    this.driver.run('create rect start 120 100 160 60 #4a90d9 in node1');
    this.driver.run('create text start-label 155 135 "开始" in node1');
    this.driver.run('create g node2 in flowchart');
    this.driver.run('create rect process 520 100 160 60 #f5a623 in node2');
    this.driver.run('create text process-label 545 135 "处理数据" in node2');
    this.driver.run('create line arrow1 280 130 520 130 black in flowchart');
  }
}

describe('group', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect bg 0 0 800 600 #ffffff');
    driver.run('create circle c1 100 100 20 red');
    driver.run('create rect box 200 80 60 60 #3366ff');
  });

  it('新建容器并收入指定图形，保持参数顺序', () => {
    expect(driver.run('group markers c1 box')).toBe('g#markers created with 2 children');
    expect(driver.document.require('c1').parent?.id).toBe('markers');
    expect(driver.document.require('markers').childCount).toBe(2);
  });

  it('新容器占据第一个被收编图形的原位置', () => {
    driver.run('group markers c1 box');
    const ids = driver.document.root.children.map((child) => child.id);
    expect(ids).toEqual(['bg', 'markers']);
  });

  it('把一个容器和它的后代一起没收时拒绝', () => {
    driver.run('group markers c1 box');
    expect(() => driver.run('group bad c1 markers')).toThrow(
      /cannot group a container into its own descendant: markers/,
    );
  });

  it('undo 把子图形放回原位并删除新容器', () => {
    driver.run('group markers c1 box');
    expect(driver.run('undo')).toBe('g#markers ungrouped');
    expect(driver.document.root.children.map((child) => child.id)).toEqual(['bg', 'c1', 'box']);
    expect(driver.document.lookup('markers')).toBeUndefined();
  });

  it('group 是一个 undo 单元', () => {
    driver.run('group markers c1 box');
    driver.undo();
    expect(driver.document.require('c1').getAttr('cx')).toBe('100');
    expect(driver.document.root.children).toHaveLength(3);
  });

  it('重复 id 与空参数被拒绝', () => {
    expect(() => driver.run('group bg c1')).toThrow(/id already exists: bg/);
    expect(() => driver.run('group empty')).toThrow(/invalid arguments/);
  });
});

describe('ungroup', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g outer');
    driver.run('create g inner in outer');
    driver.run('create rect a 0 0 10 10 in inner');
    driver.run('create rect b 10 0 10 10 in inner');
  });

  it('子图形提升到祖父级并占据原位置', () => {
    expect(driver.run('ungroup inner')).toContain('g#inner ungrouped');
    expect(driver.document.require('a').parent?.id).toBe('outer');
    expect(driver.document.require('b').parent?.id).toBe('outer');
    expect(driver.document.lookup('inner')).toBeUndefined();
    expect(driver.document.require('outer').children.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('顶层容器拒绝 ungroup', () => {
    expect(() => driver.run('ungroup outer')).toThrow(/cannot ungroup top-level container: outer/);
  });

  it('非容器拒绝 ungroup', () => {
    expect(() => driver.run('ungroup a')).toThrow(/not a container: a/);
  });

  it('undo 重新收拢子节点', () => {
    driver.run('ungroup inner');
    expect(driver.run('undo')).toContain('g#inner regrouped');
    expect(driver.document.require('a').parent?.id).toBe('inner');
    expect(driver.document.lookup('inner')).toBeDefined();
  });
});

describe('addto', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create g g1');
    driver.run('create rect r1 0 0 10 10');
    driver.run('create rect r2 0 0 10 10');
  });

  it('把已有图形移入容器并追加到末尾', () => {
    expect(driver.run('addto g1 r1')).toBe('rect#r1 added to g#g1');
    expect(driver.run('addto g1 r2')).toBe('rect#r2 added to g#g1');
    expect(driver.document.require('g1').children.map((c) => c.id)).toEqual(['r1', 'r2']);
  });

  it('拒绝把自己移进自己', () => {
    expect(() => driver.run('addto g1 g1')).toThrow(
      /cannot group a container into its own descendant: g1/,
    );
  });

  it('undo 移回原父容器', () => {
    driver.run('addto g1 r1');
    expect(driver.run('undo')).toBe('rect#r1 moved back to svg');
    expect(driver.document.require('r1').parent?.id).toBe('svg');
  });
});

describe('front / back', () => {
  let driver: Driver;

  beforeEach(() => {
    driver = new Driver();
    driver.run('init 800 600');
    driver.run('create rect a 0 0 1 1');
    driver.run('create rect b 0 0 1 1');
    driver.run('create rect c 0 0 1 1');
  });

  it('front 移到同级末尾，back 移到开头', () => {
    expect(driver.run('front a')).toBe('rect#a moved to front');
    expect(driver.document.root.children.map((s) => s.id)).toEqual(['b', 'c', 'a']);

    expect(driver.run('back c')).toBe('rect#c moved to back');
    expect(driver.document.root.children.map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });

  it('undo 恢复原层级位置', () => {
    driver.run('front a');
    expect(driver.run('undo')).toBe('rect#a moved back');
    expect(driver.document.root.children.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('流程图整体结构', () => {
  it('in 子句自顶向下构建出作业 6.1 的层级', () => {
    const fixture = new FlowFixture();
    const flowchart = fixture.driver.document.require('flowchart');
    expect(flowchart.children.map((c) => c.id)).toEqual(['node1', 'node2', 'arrow1']);
    expect(fixture.driver.document.require('node1').children.map((c) => c.id)).toEqual([
      'start',
      'start-label',
    ]);
  });

  it('容器移动带动整组子孙，undo 全部还原', () => {
    const fixture = new FlowFixture();
    const driver = fixture.driver;

    driver.run('move node2 0 100');
    expect(driver.document.require('process').getAttr('y')).toBe('200');
    expect(driver.document.require('process-label').getAttr('y')).toBe('235');

    driver.undo();
    expect(driver.document.require('process').getAttr('y')).toBe('100');
    expect(driver.document.require('process-label').getAttr('y')).toBe('135');
  });
});
