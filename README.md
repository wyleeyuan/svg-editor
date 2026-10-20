# svg-editor (Lab1 Phase 1)

高级软件开发 · Lab1 Phase 1：SVG 编辑器 CLI。TypeScript + 面向对象，Command 模式驱动，
`<g>` 容器与叶子图形统一按 Composite 语义操作。

## 运行

```bash
npm install
npm run cli          # 进入 REPL，提示符 svg>
npm test             # 单元测试
npm run typecheck    # 类型检查
npm run build        # 产出 dist/
```

## 目录

| 目录 | 职责 |
|---|---|
| `src/cli/` | REPL 外壳：读行、分派、输出 |
| `src/commands/` | 每条命令一个类，承载 undo/redo |
| `src/model/` | 文档、容器、id 索引等核心结构 |
| `src/shapes/` | 图形类层次（rect/circle/ellipse/line/text/g） |
| `src/io/` | SVG 读入、序列化与 id 补全 |
| `doc/` | 交付文档 `README.md` |

> 相对导入在 ESM + NodeNext 下必须带 `.js` 后缀，例如 `import { Repl } from './cli/Repl.js';`
> 源文件仍是 `.ts`，这是 TypeScript 的约定而非笔误。
