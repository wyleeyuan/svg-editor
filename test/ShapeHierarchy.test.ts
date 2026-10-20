import { describe, expect, it } from 'vitest';

import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { CircleShape } from '../src/shapes/CircleShape.js';
import { ContainerShape } from '../src/shapes/ContainerShape.js';
import { NumberText } from '../src/shapes/NumberText.js';
import { RectShape } from '../src/shapes/RectShape.js';
import type { Shape } from '../src/shapes/Shape.js';
import { TextShape } from '../src/shapes/TextShape.js';

describe('NumberText', () => {
  it('收敛浮点误差并去掉尾随零', () => {
    expect(NumberText.format(0.1 + 0.2)).toBe('0.3');
    expect(NumberText.format(1.0000001)).toBe('1');
    expect(NumberText.format(-0)).toBe('0');
  });

  it('非数字文本抛出异常', () => {
    expect(() => NumberText.parse('abc')).toThrow(/not a number/);
  });
});

describe('多态：不同图形走同一入口', () => {
  it('move 对 rect 与 circle 都生效，改的是各自的几何属性', () => {
    const shapes: Shape[] = [
      new RectShape('r1', 10, 20, 100, 50),
      new CircleShape('c1', 100, 100, 20),
    ];

    for (const shape of shapes) {
      shape.move(5, 5);
    }

    expect(shapes[0]?.getAttr('x')).toBe('15');
    expect(shapes[0]?.getAttr('y')).toBe('25');
    expect(shapes[1]?.getAttr('cx')).toBe('105');
    expect(shapes[1]?.getAttr('cy')).toBe('105');
  });

  it('scale 同时缩放位置与尺寸', () => {
    const rect = new RectShape('r1', 10, 20, 100, 50);
    rect.scale(2);
    expect(rect.attributePairs()).toEqual([
      ['x', '20'],
      ['y', '40'],
      ['width', '200'],
      ['height', '100'],
    ]);
  });

  it('每个图形只知道自己的属性名', () => {
    expect(new RectShape('r1', 0, 0, 1, 1).attributeNames()).toEqual(['x', 'y', 'width', 'height']);
    expect(new CircleShape('c1', 0, 0, 1).attributeNames()).toEqual(['cx', 'cy', 'r']);
  });
});

describe('Composite：容器递归', () => {
  it('move 容器等于平移全部子孙', () => {
    const group = new ContainerShape('g1');
    const rect = new RectShape('r1', 0, 0, 10, 10);
    const circle = new CircleShape('c1', 5, 5, 2);
    group.append(rect);
    group.append(circle);

    group.move(10, 20);

    expect(rect.getAttr('x')).toBe('10');
    expect(rect.getAttr('y')).toBe('20');
    expect(circle.getAttr('cx')).toBe('15');
    expect(circle.getAttr('cy')).toBe('25');
  });

  it('嵌套容器只对局部生效', () => {
    const outer = new ContainerShape('outer');
    const inner = new ContainerShape('inner');
    const rect = new RectShape('r1', 0, 0, 10, 10);
    inner.append(rect);
    outer.append(inner);

    outer.scale(2);

    expect(rect.getAttr('width')).toBe('20');
    expect(inner.parent).toBe(outer);
    expect(rect.parent).toBe(inner);
  });

  it('visit 深度优先遍历整棵子树', () => {
    const outer = new ContainerShape('outer');
    const inner = new ContainerShape('inner');
    outer.append(inner);
    inner.append(new RectShape('r1', 0, 0, 1, 1));

    const visited: string[] = [];
    outer.visit((shape: Shape) => visited.push(shape.id));

    expect(visited).toEqual(['outer', 'inner', 'r1']);
  });

  it('contains 能识别后代，且不含兄弟分支', () => {
    const outer = new ContainerShape('outer');
    const inner = new ContainerShape('inner');
    const rect = new RectShape('r1', 0, 0, 1, 1);
    const stranger = new RectShape('r9', 0, 0, 1, 1);
    outer.append(inner);
    inner.append(rect);

    expect(outer.contains(rect)).toBe(true);
    expect(outer.contains(outer)).toBe(true);
    expect(outer.contains(stranger)).toBe(false);
  });

  it('append / insertAt / detach 维护顺序与父指针', () => {
    const group = new ContainerShape('g1');
    const a = new RectShape('a', 0, 0, 1, 1);
    const b = new RectShape('b', 0, 0, 1, 1);
    const c = new RectShape('c', 0, 0, 1, 1);

    group.append(a);
    group.append(b);
    group.insertAt(c, 1);
    expect(group.children.map((s) => s.id)).toEqual(['a', 'c', 'b']);

    expect(group.detach(c)).toBe(1);
    expect(c.parent).toBeNull();
    expect(group.children.map((s) => s.id)).toEqual(['a', 'b']);
    expect(group.detach(c)).toBe(-1);
  });

  it('已挂载的图形不能被重复挂载', () => {
    const group = new ContainerShape('g1');
    const rect = new RectShape('r1', 0, 0, 1, 1);
    group.append(rect);
    expect(() => group.append(rect)).toThrow(/already attached/);
  });
});

describe('快照与还原', () => {
  it('restore 能把几何与外观一起还原', () => {
    const rect = new RectShape('r1', 10, 20, 100, 50);
    rect.setAttr('fill', 'red');
    const snapshot = rect.snapshot();

    rect.move(5, 5);
    rect.setAttr('fill', 'blue');
    rect.restore(snapshot);

    expect(rect.getAttr('x')).toBe('10');
    expect(rect.getAttr('y')).toBe('20');
    expect(rect.getAttr('fill')).toBe('red');
  });

  it('快照未包含的外观属性在还原后回到未设置状态', () => {
    const rect = new RectShape('r1', 0, 0, 1, 1);
    const snapshot = rect.snapshot();
    rect.setAttr('stroke', 'black');
    rect.restore(snapshot);

    expect(rect.getAttr('stroke')).toBeUndefined();
  });

  it('文本内容随快照一起还原', () => {
    const text = new TextShape('t1', 20, 40, 'My Diagram');
    const snapshot = text.snapshot();
    text.setAttr('text', 'v2');
    text.restore(snapshot);

    expect(text.getAttr('text')).toBe('My Diagram');
  });
});

describe('ShapeFactory', () => {
  it('创建六种内置类型', () => {
    expect(ShapeFactory.create('rect', 'r1', ['0', '0', '10', '10']).typeName).toBe('rect');
    expect(ShapeFactory.create('circle', 'c1', ['0', '0', '5']).typeName).toBe('circle');
    expect(ShapeFactory.create('ellipse', 'e1', ['0', '0', '5', '3']).typeName).toBe('ellipse');
    expect(ShapeFactory.create('line', 'l1', ['0', '0', '10', '10']).typeName).toBe('line');
    expect(ShapeFactory.create('text', 't1', ['0', '0', 'hi']).typeName).toBe('text');
    expect(ShapeFactory.create('g', 'g1', []).typeName).toBe('g');
  });

  it('可选的外观参数写入对应属性', () => {
    const rect = ShapeFactory.create('rect', 'r1', ['0', '0', '10', '10', '#eee']);
    expect(rect.getAttr('fill')).toBe('#eee');

    const line = ShapeFactory.create('line', 'l1', ['0', '0', '10', '10', 'black']);
    expect(line.getAttr('stroke')).toBe('black');
  });

  it('省略外观参数时不写入该属性', () => {
    const rect = ShapeFactory.create('rect', 'r1', ['0', '0', '10', '10']);
    expect(rect.getAttr('fill')).toBeUndefined();
    expect(rect.attributePairs().map(([name]) => name)).toEqual(['x', 'y', 'width', 'height']);
  });

  it('未注册的类型报 unknown shape type', () => {
    expect(() => ShapeFactory.create('hexagon', 'h1', [])).toThrow(
      /unknown shape type: hexagon \(is the plugin loaded\?\)/,
    );
  });

  it('缺少参数时报参数错误', () => {
    expect(() => ShapeFactory.create('rect', 'r1', ['1', '2'])).toThrow(/invalid arguments/);
    expect(() => ShapeFactory.create('rect', 'r1', ['1', '2', 'x', '4'])).toThrow(
      /is not a number/,
    );
  });
});
