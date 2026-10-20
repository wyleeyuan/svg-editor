# Lab1 Phase 1 执行计划书

> **唯一进度入口。** 每天说一句「继续」，我做完当天任务后更新本文件的三处（看板 / 今天做什么 / 日志），
> 并按作业要求分步提交推送。你只看这一个文件即可，不需要翻对话记录。

**最后更新**：2026-10-20 14:35 ｜ **当前阶段**：0 已完成 ｜ **总进度**：3 / 40 项

```text
░░░░░░░░░░░░░░░░░░░░  7%
```

## 一、进度看板

| 阶段 | 内容                 | 状态      | 提交                          |
| ---- | -------------------- | --------- | ----------------------------- |
| 0    | 工程地基             | ✅ 完成   | `17651ce` `6cc2dfb` `935ffae` |
| 1    | 图形类层次           | ⬜ 待开始 | —                             |
| 2    | 文档模型与命令骨架   | ⬜ 待开始 | —                             |
| 3    | 撤销 / 重做          | ⬜ 待开始 | —                             |
| 4    | 容器结构操作         | ⬜ 待开始 | —                             |
| 5    | 属性与显示格式       | ⬜ 待开始 | —                             |
| 6    | SVG 读写             | ⬜ 待开始 | —                             |
| 7    | 契约对齐与边界       | ⬜ 待开始 | —                             |
| 8    | 文档与交付（打 tag） | ⬜ 待开始 | —                             |

图例：✅ 完成 ｜ 🚧 进行中 ｜ ⬜ 待开始

## 二、今天做什么

> **下一步：1.1 图形基类 + 1.2 四种几何叶子**

| 项     | 内容                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 产出   | `Shape.ts`、`RectShape.ts`、`CircleShape.ts`、`EllipseShape.ts`、`LineShape.ts` |
| 关键点 | `move` / `scale` / `set` / `snapshot` 全由子类实现，基类只定契约                |
| 验收   | `npm run verify` 通过；单测证明 rect 与 circle 走同一入口、行为各异             |
| 开工   | 回一句「继续」                                                                  |

## 三、任务清单

### 阶段 0 · 工程地基 ✅

- [x] 0.1 目录结构、`tsconfig`、git 初始化
- [x] 0.2 工具链：ESLint + Prettier + vitest + coverage
- [x] 0.3 编辑器配置（SVG 预览、PlantUML 远程渲染）
- [x] 0.4 REPL 空壳（banner / 注释跳过 / help / exit）

### 阶段 1 · 图形类层次

- [ ] 1.1 `Shape` 抽象基类：id、父容器、属性表、`move`/`scale`/`set`/`snapshot` 契约
- [ ] 1.2 四种几何叶子：`RectShape`、`CircleShape`、`EllipseShape`、`LineShape`
- [ ] 1.3 `TextShape`：文本是子文本而非属性，`set text` 另走一条路
- [ ] 1.4 `ContainerShape`：Composite 递归 `move`/`scale`，子节点有序
- [ ] 1.5 `ShapeFactory`：类型名 → 类（**按名分派点①**，标注待重构）
- [ ] 1.6 单测：多态、容器递归、几何属性缩放

### 阶段 2 · 文档模型与命令骨架

- [ ] 2.1 `Document`：画布尺寸、虚拟根、id 索引（唯一性 + O(1) 查找）
- [ ] 2.2 `Command` 接口 + `CommandError`：12 条错误消息集中定义
- [ ] 2.3 `CreateCommand` / `DeleteCommand` / `MoveCommand`
- [ ] 2.4 `Tokenizer`：引号参数、`#` 注释、空行
- [ ] 2.5 `CommandRegistry`（**按名分派点②**）+ 接入 REPL
- [ ] 2.6 跑通 `init` / `create` / `move` / `delete`

### 阶段 3 · 撤销 / 重做

- [ ] 3.1 `CommandHistory`：undo/redo 双栈，新编辑清空 redo
- [ ] 3.2 io 锁定：`init`/`read`/`save`/`canvas` 改尺寸后禁止 undo，下次编辑解禁
- [ ] 3.3 `undo` / `redo` 命令接入
- [ ] 3.4 单测：undo 粒度（`group` 整体一个单元）、锁定、redo 清空

### 阶段 4 · 容器结构操作

- [ ] 4.1 `GroupCommand`：从各自父容器摘出，保持相对顺序
- [ ] 4.2 `UngroupCommand`：子图形提升到祖父级、占据原位置；顶层容器拒绝
- [ ] 4.3 `AddToCommand`
- [ ] 4.4 `FrontCommand` / `BackCommand`
- [ ] 4.5 自环 / 后代检测（`cannot group a container into its own descendant`）

### 阶段 5 · 属性与显示格式

- [ ] 5.1 `SetCommand` + 属性白名单（含各类型几何属性与 `text` 内容）
- [ ] 5.2 `TreeRenderer`：`├──` `└──` 缩进 + 属性内联，列对齐
- [ ] 5.3 `ShowRenderer`：类型、父容器、属性明细
- [ ] 5.4 `help` 改由注册表生成，避免文案与实现脱节

### 阶段 6 · SVG 读写

- [ ] 6.1 `SvgWriter`：序列化 + 数字格式化（去浮点尾巴）
- [ ] 6.2 `SvgReader`：解析 XML → 对象树
- [ ] 6.3 缺 id 自动补全 + `warning:` 输出
- [ ] 6.4 round-trip 测试（含作业 `other.svg`）

### 阶段 7 · 契约对齐与边界

- [ ] 7.1 12 条错误信息逐条测试
- [ ] 7.2 边界用例：空文档、重复 id、非正数 scale、未知属性
- [ ] 7.3 覆盖率补到 80% 以上

### 阶段 8 · 文档与交付

- [ ] 8.1 `doc/README.md` 架构方案四节（模块划分 / 设计模式 / 依赖方向 / 变化点假设）
- [ ] 8.2 PlantUML 组件图
- [ ] 8.3 过程记录（AI 协作中的问题与纠正）
- [ ] 8.4 一致性自查 + 质量保证手段
- [ ] 8.5 打 tag `final` 并推送

## 四、每日日志

| 日期       | 完成内容                                                  | 提交                          | 验证                  |
| ---------- | --------------------------------------------------------- | ----------------------------- | --------------------- |
| 2026-10-20 | 建仓、脚手架、工具链、开发计划；GitHub SSH 与远程仓库打通 | `17651ce` `6cc2dfb` `935ffae` | `npm run verify` 通过 |

## 五、技术路线要点

细节写进 `doc/README.md`（交付文档），这里只留会反复用到的结论。

| 决策       | 结论                                                                 |
| ---------- | -------------------------------------------------------------------- |
| undo 实现  | 命令对象 + 受影响图形属性快照，不用逆运算（浮点 `x+dx-dx ≠ x`）      |
| 容器变换   | 不引入 `transform`，`move g` 递归改子孙坐标；读入的 transform 只警告 |
| 按名分派   | 仅 `CommandRegistry` 与 `ShapeFactory` 两处，均标注待重构            |
| 依赖方向   | `cli → commands → model → shapes`，`io → model/shapes`，禁止反向     |
| 数字序列化 | 统一 `formatNumber`，最多 3 位小数并去尾零                           |

### 已知难点与对策

| 难点                            | 对策                                            |
| ------------------------------- | ----------------------------------------------- |
| `delete` 后 undo 回到原父原层级 | 快照记录 `parentId` + `index`，按索引插回       |
| `group` 目标含容器与其子孙      | 祖先链检测，命中报错                            |
| 多图形来自不同父容器            | 按参数顺序逐个摘出再挂载                        |
| `read` 补 id 与已有 id 撞车     | 先扫描全量 id，再按 `tagName+序号` 递增跳过冲突 |

## 六、Git 提交规范（作业硬性要求）

1. **每完成一个任务项就提交并推送**，禁止攒到最后一次性提交：
   ```bash
   npm run verify
   git add -A && git commit -m "feat(shapes): add rect and circle shapes"
   git push
   ```
2. 提交信息用 `type(scope): 描述`，`type` 取 `feat` / `fix` / `refactor` / `test` / `docs` / `chore`。
3. **收尾必须打 tag 并单独推**（`git push` 默认不推 tag，最容易丢分）：
   ```bash
   git tag -a final -m "Lab1 Phase 1 final submission"
   git push origin final
   ```
4. 提交前自检：`git log --oneline` 看历史是否分步、`git status` 是否干净、`npm run verify` 是否全绿。

## 附录 · 硬约束自查表（收尾时逐条打勾）

| #   | 约束                               | 落地位置                          | 验收方式                    |
| --- | ---------------------------------- | --------------------------------- | --------------------------- |
| 1   | TypeScript + OOP，类层次 + 多态    | `src/shapes/`                     | 无 `switch(tag)`，多态覆写  |
| 2   | 一类一文件，文件名 = 类名          | 全项目                            | `ls src/shapes/*.ts` 对齐   |
| 3   | 禁止贫血模型 + 过程式自由函数      | 全项目                            | 不导出裸函数                |
| 4   | 按名分派只允许两处，且标注待重构   | `CommandRegistry`、`ShapeFactory` | 文件头 TODO + 文档标注      |
| 5   | 必须使用 Command 模式              | `src/commands/`                   | 每个编辑命令一个类          |
| 6   | 容器与叶子统一操作（Composite）    | `Shape` 基类接口                  | 无 `instanceof` 分支        |
| 7   | 一条编辑命令 = 一个 undo 单元      | `CommandHistory`                  | `group g1 r1 c1` 一次全还原 |
| 8   | io 后 undo/redo 禁止，下次编辑解禁 | `CommandHistory.lock()`           | 脚本事例验证                |
| 9   | 12 条错误信息逐字对齐              | `CommandError`                    | 每条一个测试                |
| 10  | tree / show 输出格式对齐           | `TreeRenderer`、`ShowRenderer`    | 与作业第 5 节逐行比对       |
| 11  | read 缺 id 自动补 + 警告           | `SvgReader`                       | 用作业 `other.svg` 验证     |
| 12  | `doc/README.md` 四节齐全           | `doc/README.md`                   | 对照 1.2 节                 |
