# Lab1 Phase 1 执行计划书

> **唯一进度入口。** 每天说一句「继续」，我做完当天任务后更新本文件的三处（看板 / 今天做什么 / 日志），
> 并按作业要求分步提交推送。你只看这一个文件即可，不需要翻对话记录。

**最后更新**：2026-10-20 15:03 ｜ **当前阶段**：8 已完成，待你验收 ｜ **总进度**：40 / 41 项

```text
███████████████████░  98%
```

## 一、进度看板

| 阶段 | 内容               | 状态      | 提交                             |
| ---- | ------------------ | --------- | -------------------------------- |
| 0    | 工程地基           | ✅ 完成   | `17651ce` `6cc2dfb` `935ffae`    |
| 1    | 图形类层次         | ✅ 完成   | `4cce1ff`                        |
| 2    | 文档模型与命令骨架 | ✅ 完成   | `64fc9c3` `b1b5c18` `937790b`    |
| 3    | 撤销 / 重做        | ✅ 完成   | `066f6cd`                        |
| 4    | 容器结构操作       | ✅ 完成   | `6202cac`                        |
| 5    | 属性与显示格式     | ✅ 完成   | `7dbe65e`                        |
| 6    | SVG 读写           | ✅ 完成   | `e650299`                        |
| 7    | 契约对齐与边界     | ✅ 完成   | `c0c9e5d`                        |
| 8    | 文档与交付         | 🚧 待验收 | `99cd129` `bb128c7` + 本条计划书 |

图例：✅ 完成 ｜ 🚧 进行中 ｜ ⬜ 待开始

## 二、现在做什么

> **代码与文档已全部完成，只剩「打 tag」等你手动验收后执行。**

| 项     | 内容                                                                                                                                           |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 验收   | `npm run cli` 后依次试 `init` → `create` → `tree` → `save` → `read` → `undo`，对照作业第 5、6 节的输出格式                                     |
| 看报告 | `doc/README.md`：架构方案 / 过程记录 9 条 / 一致性自查 / 质量保证；配图 `doc/architecture.png`                                                 |
| 交付   | 验收通过后打 tag 并**单独推**（`git push` 默认不推 tag）：<br>`git tag -a final -m "Lab1 Phase 1 final submission"`<br>`git push origin final` |
| 我这边 | 想改哪里回一句就行；改完照旧 `npm run verify` → 提交 → 推送 → 更新本文件                                                                       |

## 三、任务清单

### 阶段 0 · 工程地基 ✅

- [x] 0.1 目录结构、`tsconfig`、git 初始化
- [x] 0.2 工具链：ESLint + Prettier + vitest + coverage
- [x] 0.3 编辑器配置（SVG 预览、PlantUML 远程渲染）
- [x] 0.4 REPL 空壳（banner / 注释跳过 / help / exit）

### 阶段 1 · 图形类层次 ✅

- [x] 1.1 `Shape` 抽象基类：id、父容器、属性表、`move`/`scale`/`set`/`snapshot` 契约
- [x] 1.2 四种几何叶子：`RectShape`、`CircleShape`、`EllipseShape`、`LineShape`
- [x] 1.3 `TextShape`：文本是子文本而非属性，`set text` 另走一条路
- [x] 1.4 `ContainerShape`：Composite 递归 `move`/`scale`，子节点有序
- [x] 1.5 `ShapeFactory`：类型名 → 类（**按名分派点①**，标注待重构）
- [x] 1.6 单测：多态、容器递归、几何属性缩放

### 阶段 2 · 文档模型与命令骨架 ✅

- [x] 2.1 `Document`：画布尺寸、虚拟根、id 索引（唯一性 + O(1) 查找）
- [x] 2.2 `Command` 接口 + `CommandError`：17 条错误消息集中定义
- [x] 2.3 `CreateCommand` / `DeleteCommand` / `MoveCommand`
- [x] 2.4 `Tokenizer`：引号参数、`#` 注释、空行
- [x] 2.5 `CommandRegistry`（**按名分派点②**）+ 接入 REPL
- [x] 2.6 跑通 `init` / `create` / `move` / `delete`

### 阶段 3 · 撤销 / 重做 ✅

- [x] 3.1 `CommandHistory`：undo/redo 双栈，新编辑清空 redo
- [x] 3.2 io 锁定：`init`/`read`/`save`/`canvas` 改尺寸后禁止 undo，下次编辑解禁
- [x] 3.3 `undo` / `redo` 命令接入
- [x] 3.4 单测：undo 粒度（`group` 整体一个单元）、锁定、redo 清空

### 阶段 4 · 容器结构操作 ✅

- [x] 4.1 `GroupCommand`：从各自父容器摘出，保持相对顺序
- [x] 4.2 `UngroupCommand`：子图形提升到祖父级、占据原位置；顶层容器拒绝
- [x] 4.3 `AddToCommand`
- [x] 4.4 `FrontCommand` / `BackCommand`
- [x] 4.5 自环 / 后代检测（`cannot group a container into its own descendant`）

### 阶段 5 · 属性与显示格式 ✅

- [x] 5.1 `SetCommand` + 属性白名单（含各类型几何属性与 `text` 内容）
- [x] 5.2 `TreeRenderer`：`├──` `└──` 缩进 + 属性内联，列对齐
- [x] 5.3 `ShowRenderer`：类型、父容器、属性明细
- [x] 5.4 `help` 改由注册表生成，避免文案与实现脱节

### 阶段 6 · SVG 读写 ✅

- [x] 6.1 `SvgWriter`：序列化 + 数字格式化（去浮点尾巴）
- [x] 6.2 `SvgReader`：解析 XML → 对象树
- [x] 6.3 缺 id 自动补全 + `warning:` 输出
- [x] 6.4 round-trip 测试（含作业 `other.svg`）

### 阶段 7 · 契约对齐与边界 ✅

- [x] 7.1 12 条错误信息逐条测试
- [x] 7.2 边界用例：空文档、重复 id、非正数 scale、未知属性
- [x] 7.3 覆盖率补到 80% 以上（实测 85.6% 语句 / 90.2% 分支）

### 阶段 8 · 文档与交付 🚧

- [x] 8.1 `doc/README.md` 架构方案四节（模块划分 / 设计模式 / 依赖方向 / 变化点假设）
- [x] 8.2 PlantUML 包图（`doc/architecture.puml` + 导出的 `architecture.png`）
- [x] 8.3 过程记录（AI 协作中的问题与纠正，9 条）
- [x] 8.4 一致性自查 + 质量保证手段
- [ ] 8.5 打 tag `final` 并推送 —— **等你手动验收后执行**，命令见第二节

## 四、每日日志

| 日期       | 完成内容                                                                               | 提交                             | 验证                      |
| ---------- | -------------------------------------------------------------------------------------- | -------------------------------- | ------------------------- |
| 2026-10-20 | 建仓、脚手架、工具链、开发计划；GitHub SSH 与远程仓库打通                              | `17651ce` `6cc2dfb` `935ffae`    | `npm run verify` 通过     |
| 2026-10-20 | 阶段 1：Shape 基类 + 5 个叶子 + 容器 + 工厂，19 项单测                                 | `4cce1ff`                        | 覆盖率 68.6%，分支 90.5%  |
| 2026-10-20 | 阶段 2：`Document` + id 索引 + 17 条错误契约；create/delete/move/scale；分词器与注册表 | `64fc9c3` `b1b5c18` `937790b`    | `npm run verify` 通过     |
| 2026-10-20 | 阶段 3：双栈撤销 + `kind` 三态（io 锁定 / display 不占栈）                             | `066f6cd`                        | 锁定与解禁用例通过        |
| 2026-10-20 | 阶段 4：group / ungroup / addto / front / back，含自环与后代检测                       | `6202cac`                        | 17 项容器用例通过         |
| 2026-10-20 | 阶段 5：set 白名单 + tree/show 渲染器 + help 由注册表生成                              | `7dbe65e`                        | 与作业第 5 节输出逐行一致 |
| 2026-10-20 | 阶段 6：SVG 读写、缺 id 补全、round-trip；`other.svg` 逐字复现第 6 节                  | `e650299`                        | 13 项 IO 用例通过         |
| 2026-10-20 | 阶段 7：契约与边界补测，7 文件 106 用例                                                | `c0c9e5d`                        | 85.6% 语句 / 90.2% 分支   |
| 2026-10-20 | 阶段 8：README 四节 + PlantUML 包图；自查揪出并修掉第三处分派点                        | `99cd129` `bb128c7` + 本条计划书 | lint 与 106 用例全绿      |

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
   > 状态：**尚未执行**。等你手动验收通过后再打，命令见第二节。
4. 提交前自检：`git log --oneline` 看历史是否分步、`git status` 是否干净、`npm run verify` 是否全绿。

## 附录 · 硬约束自查表（2026-10-20 逐条核对，12 / 12 通过）

| #   | 约束                               | 落地位置                          | 验收方式                    | 结果 |
| --- | ---------------------------------- | --------------------------------- | --------------------------- | ---- |
| 1   | TypeScript + OOP，类层次 + 多态    | `src/shapes/`                     | 无 `switch(tag)`，多态覆写  | ✅   |
| 2   | 一类一文件，文件名 = 类名          | 全项目                            | `ls src/shapes/*.ts` 对齐   | ✅   |
| 3   | 禁止贫血模型 + 过程式自由函数      | 全项目                            | 不导出裸函数                | ✅   |
| 4   | 按名分派只允许两处，且标注待重构   | `CommandRegistry`、`ShapeFactory` | 文件头 TODO + 文档标注      | ✅   |
| 5   | 必须使用 Command 模式              | `src/commands/`                   | 每个编辑命令一个类          | ✅   |
| 6   | 容器与叶子统一操作（Composite）    | `Shape` 基类接口                  | 无 `instanceof` 分支        | ✅   |
| 7   | 一条编辑命令 = 一个 undo 单元      | `CommandHistory`                  | `group g1 r1 c1` 一次全还原 | ✅   |
| 8   | io 后 undo/redo 禁止，下次编辑解禁 | `CommandHistory.lock()`           | 脚本事例验证                | ✅   |
| 9   | 错误信息逐字对齐                   | `CommandError`                    | 每条一个测试                | ✅   |
| 10  | tree / show 输出格式对齐           | `TreeRenderer`、`ShowRenderer`    | 与作业第 5 节逐行比对       | ✅   |
| 11  | read 缺 id 自动补 + 警告           | `SvgReader`                       | 用作业 `other.svg` 验证     | ✅   |
| 12  | `doc/README.md` 四节齐全           | `doc/README.md`                   | 对照 1.2 节                 | ✅   |

注：第 9 条的「12 条错误」是作业正文列举的数量，实现里是 `CommandError` 的 17 个静态工厂
（覆盖作业全部 12 条 + 5 条内部校验），测试逐条断言消息体。
