# SVG 编辑器（CLI）

「高级软件开发技术」Lab1 Phase 1 作业：用 **TypeScript + 面向对象**实现的交互式 SVG 编辑器。
REPL 逐行读入命令，所有编辑操作可撤销，文档能存成标准 SVG 再读回。

```text
svg> init 800 600
canvas 800x600 created
svg> create rect r1 10 10 100 50
rect#r1 created
svg> tree
svg (800x600)
└── rect#r1  x=10 y=10 w=100 h=50
```

## 设计要点

| 要点             | 做法                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Command 模式** | 每条命令一个类，`execute(session)` / `undo(session)` 成对；一条编辑命令 = 一个撤销单元 |
| **Composite**    | `<g>` 容器与叶子图形同一接口，`move` / `scale` / `set` / `delete` 对二者一视同仁       |
| **快照撤销**     | 撤销写回属性快照而非做逆运算：浮点不漂移，`group` / `delete` 等结构操作也能整套还原    |
| **两处按名分派** | 只有命令注册表与图形工厂两张表，其余地方没有 `switch (type)`                           |
| **依赖单向**     | `cli → commands → model → shapes`，`io` 只依赖 `model` / `shapes`                      |

完整的架构方案、过程记录、一致性自查与质量保证见 [**doc/README.md**](doc/README.md)，
模块依赖图见 [doc/architecture.png](doc/architecture.png)（源文件 `doc/architecture.puml`）。

## 环境要求

Node.js 20 以上、npm 10 以上（开发环境为 Node 22.22.2 / npm 10.9.7），无其他系统依赖。

## 快速开始

```bash
npm install
npm run cli            # 进入 REPL，提示符 svg>
```

把命令序列存成文件还能直接回放（`#` 开头是注释）：

```bash
npm run cli --silent < script.txt
```

常用脚本：

| 命令                | 作用                                         |
| ------------------- | -------------------------------------------- |
| `npm run cli`       | 启动 REPL                                    |
| `npm test`          | 单元测试（108 个用例）                       |
| `npm run coverage`  | 覆盖率报告，输出到 `coverage/`               |
| `npm run verify`    | 类型检查 + ESLint + 测试，提交前跑这一条     |
| `npm run typecheck` | `tsc --noEmit`，strict 全开                  |
| `npm run lint`      | ESLint（flat config）                        |
| `npm run format`    | Prettier 格式化；`format:check` 只检查不写盘 |
| `npm run build`     | 编译到 `dist/`                               |

## 示例会话

```text
$ npm run cli

svg-editor 0.1 — type 'help' for commands

svg> init 800 600
canvas 800x600 created
svg> create rect bg 0 0 800 600 #ffffff
rect#bg created
svg> create text title 20 40 "My Diagram"
text#title created
svg> create g markers
g#markers created
svg> create circle c1 100 100 20 red in markers
circle#c1 created in g#markers
svg> tree
svg (800x600)
├── rect#bg        x=0 y=0 w=800 h=600 fill=#ffffff
├── text#title     (20,40) "My Diagram"
└── g#markers
    ├── circle#c1  cx=100 cy=100 r=20 fill=red
    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff
svg> move c1 30 0
circle#c1 moved to (130,100)
svg> undo
circle#c1 moved back to (100,100)
svg> save demo.svg
saved to demo.svg (5 elements)
```

`demo.svg` 用浏览器直接打开即可看到图形：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect id="bg" x="0" y="0" width="800" height="600" fill="#ffffff"/>
  <text id="title" x="20" y="40">My Diagram</text>
  <g id="markers">
    <circle id="c1" cx="100" cy="100" r="20" fill="red"/>
    <rect id="box" x="200" y="80" width="60" height="60" fill="#3366ff"/>
  </g>
</svg>
```

## 命令一览

`create` 的类型参数：`rect x y w h`、`circle cx cy r`、`ellipse cx cy rx ry`、
`line x1 y1 x2 y2`、`text x y "内容"`、`g`；后接可选 `[in <containerId>]`。

| 类别     | 命令                                      | 说明                                   |
| -------- | ----------------------------------------- | -------------------------------------- |
| 文档     | `init [w] [h]`                            | 新建画布，默认 800×600                 |
|          | `read <file.svg>`                         | 读入 SVG，缺 id 自动补全并打印警告     |
|          | `save [file.svg]`                         | 存盘；省略路径时写回上次读入的文件     |
|          | `canvas [w] [h]`                          | 查看或修改画布尺寸                     |
| 图形编辑 | `create <type> <id> [params…] [in <gid>]` | 新建图形                               |
|          | `delete <id>`                             | 删除图形及其子孙                       |
|          | `move <id> <dx> <dy>`                     | 平移                                   |
|          | `scale <id> <factor>`                     | 以锚点等比缩放，因子必须为正           |
|          | `set <id> <attr> <value>`                 | 改属性；`text` 改文字内容              |
| 结构     | `group <newGid> <id1> <id2>…`             | 收编为容器，保持文档次序               |
|          | `ungroup <gid>`                           | 解散容器，子节点提升到祖父级           |
|          | `addto <gid> <id>`                        | 把图形移入容器                         |
|          | `front <id>` / `back <id>`                | 置顶 / 置底                            |
| 显示     | `tree [id]`                               | 结构树，属性内联                       |
|          | `show <id>`                               | 单个图形的属性明细                     |
|          | `help`                                    | 命令列表，由注册表生成，不会与实现脱节 |
| 撤销     | `undo` / `redo`                           | io 命令之后禁止，下一次编辑自动解禁    |
| 退出     | `exit` / `quit`                           | 结束 REPL                              |

## 目录结构

```text
src/
├── cli/        交互层：读行、分词、命令登记（Repl / Tokenizer / CommandRegistry）
├── commands/   命令层：每条命令一个类、撤销栈、tree/show 渲染
├── model/      模型层：Document、id 索引、ShapeFactory、CommandError
├── shapes/     图形层：Shape 基类、五个叶子类、ContainerShape
└── io/         持久化层：SvgReader / SvgWriter

test/           7 个测试文件 + 作业自带的 other.svg 夹具
doc/            交付文档 doc/README.md 与架构图
```

依赖方向与"禁止依赖"清单见 [doc/README.md](doc/README.md) 第 3 节。

## 质量保证

```bash
npm run verify     # tsc --noEmit + eslint + vitest
```

- **108 个用例、7 个测试文件**，按图形层 / 命令层 / 结构操作 / 显示 / 持久化 / 契约 / 端到端分层；
- 覆盖率 **85.9% 语句 / 90.1% 分支**（`npm run coverage`）；
- 作业 4.2 的 12 条错误信息在 `Contracts.test.ts` 里逐字断言；
- 作业第 6 节与 6.1 节的两段 transcript 整段回放比对，`read other.svg` 的输出与原文逐字一致。

## 提交说明

| 交付物 | 位置                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| 代码   | 本仓库，分步提交；最终提交处打 tag `final`                                        |
| 文档   | [`doc/README.md`](doc/README.md)：架构方案 / 过程记录 / 一致性自查 / 质量保证手段 |
| 架构图 | `doc/architecture.puml` 及导出的 `doc/architecture.png`                           |

> 相对导入在 ESM + NodeNext 下必须带 `.js` 后缀，例如 `import { Repl } from './cli/Repl.js';`。
> 源文件仍是 `.ts`，这是 TypeScript 的约定而非笔误。
