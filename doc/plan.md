# 开发计划与技术路线

本文件记录 Lab1 Phase 1 的架构路线、阶段划分与提交节奏。架构方案正文见 `doc/README.md`，
这里只回答"怎么一步步做出来、每一步提交什么"。

## 一、硬约束清单

作业里不可协商的条款，逐条对应到落地位置，收尾时按此表打勾自查。

| #   | 约束                                   | 落地位置                          | 验收方式                                           |
| --- | -------------------------------------- | --------------------------------- | -------------------------------------------------- |
| 1   | TypeScript + 面向对象，类层次 + 多态   | `src/shapes/`                     | 无 `switch(tag)` 分派；`move/scale/set` 由子类覆写 |
| 2   | 一类一文件，文件名 = 类名              | 全项目                            | `ls src/shapes/*.ts` 与类名一一对应                |
| 3   | 禁止贫血模型 + 过程式自由函数          | 全项目                            | 每个 `.ts` 导出类或类型，不导出裸函数              |
| 4   | 按名字分派只允许两处，且标注待重构     | `CommandRegistry`、`ShapeFactory` | 文件头 TODO 注释 + 文档标注                        |
| 5   | 必须使用 Command 模式                  | `src/commands/`                   | 每个编辑命令一个类，`execute` / `undo` 成对        |
| 6   | 容器与叶子统一操作（Composite）        | `Shape` 基类接口                  | `g` 与 `rect` 走同一入口，无 `instanceof` 分支     |
| 7   | 一条编辑命令 = 一个 undo 单元          | `CommandHistory`                  | `group g1 r1 c1` 一次 undo 全还原                  |
| 8   | io 命令后 undo/redo 禁止，下次编辑解禁 | `CommandHistory.lock()`           | 脚本回放验证                                       |
| 9   | 12 条错误信息逐字对齐                  | `src/model/CommandError.ts`       | 每条一个测试用例                                   |
| 10  | tree / show 输出格式对齐               | `src/cli/Renderer.ts`             | 与作业第 5 节逐行比对                              |
| 11  | read 缺 id 自动补 + 警告               | `src/io/SvgReader.ts`             | 用作业 `other.svg` 验证                            |
| 12  | doc/README.md 四节齐全                 | `doc/README.md`                   | 对照 1.2 节                                        |

## 二、技术路线

### 2.1 分层与依赖方向

```text
cli  ──▶  commands  ──▶  model  ──▶  shapes
 │                          ▲          ▲
 └──────────▶  io  ─────────┴──────────┘
```

| 模块        | 职责                                          | 允许依赖            |
| ----------- | --------------------------------------------- | ------------------- |
| `shapes/`   | 图形类层次，唯一知道"几何怎么变"的地方        | 无                  |
| `model/`    | `Document`、id 索引、`ShapeFactory`、错误类型 | `shapes`            |
| `commands/` | 命令对象与撤销栈                              | `model`、`shapes`   |
| `io/`       | SVG 解析与序列化                              | `model`、`shapes`   |
| `cli/`      | 分词、命令注册表、输出渲染、REPL              | `commands`、`model` |

反向依赖一律禁止：`shapes` 不认识 `model`，`model` 不认识 `commands`，
`commands` 不认识 `cli`。这条规则的好处是 `shapes` 可以脱离编辑器单独测试。

### 2.2 三个关键设计决策

**① undo 用"命令对象 + 属性快照"，不用全量快照**

`move` 用逆运算看似够用，但浮点不精确：`x + dx - dx` 未必等于 `x`（`0.1 + 0.2 - 0.2`）。
`scale(1/f)` 同理，`set` 需要旧值，`delete` 需要整棵子树和原位置。

统一做法：每个命令执行前，把受影响图形的几何属性拍一份快照存在命令对象里，`undo` 时写回。
这是"Memento 作为 Command 的内部实现"，命令模式的结构不变，但撤销精确、代码统一。
代价是内存（作业规模可忽略），收益是 `group`/`ungroup`/`delete` 这些结构性操作也能一套逻辑还原。

**② 容器不引入 `transform` 属性，直接改子孙坐标**

作业对 `scale` 的定义是"同乘到图形的全部几何属性，作用于容器时递归到每个子孙"。所以内部模型里
`<g>` 不带变换矩阵，`move g` 就是递归平移每个子孙。好处：序列化干净、`tree` 显示无需换算、
`scale` 语义与叶子完全一致。

代价：`read` 遇到外部带 `transform` 的 `<g>` 需要处理。本阶段决定**不解析 transform**，
读到就打印警告并按原样保留——这条写进了「变化点假设」，留了接缝但没启用。

**③ 两个分派点集中在注册表**

- `CommandRegistry`：命令名 → 命令构造器
- `ShapeFactory`：类型名 → 图形类

除此之外全项目用多态，不出现 `switch(tag)`。这两处按作业要求标注为待重构项（后续插件化阶段
会换成 `ShapeProvider` 插槽）。

### 2.3 已知难点与对策

| 难点                                                    | 对策                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `delete` 后 undo 要还原到"原来的父容器、原来的层级位置" | 快照记录 `parentId` + `index`，还原时按索引插入                           |
| `group` 目标同时包含某容器与其子孙                      | 建图检测祖先链，命中报 `cannot group a container into its own descendant` |
| `ungroup` 根级容器被拒                                  | 判断 `parent === document.root`                                           |
| `group` 时多个图形来自不同父容器，需保持相对顺序        | 按参数顺序逐个摘出再挂载                                                  |
| 浮点坐标序列化出 `99.99999999`                          | `SvgWriter` 统一走 `formatNumber`，最多 3 位小数并去尾零                  |
| `read` 的 id 补全可能与已有 id 撞车                     | 先扫描全量已有 id，再按 `tagName + 序号` 递增跳过冲突                     |
| 空文档执行编辑命令                                      | `Document` 未初始化时统一报 `error: no document...`                       |

## 三、提交计划

一个阶段对应一个可运行、可测试的增量，阶段内可拆多个小提交，但**禁止一次性大提交**。
下表即"每天做什么、提交什么"。

| 阶段     | 内容                                                                                                   | 提交信息                                                                                                                                        | 验收标准                                              |
| -------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **0** ✅ | 脚手架 + 工具链                                                                                        | `chore: scaffold TypeScript CLI project skeleton`<br>`chore: add lint, format and coverage toolchain`                                           | `npm run verify` 通过                                 |
| **1**    | `Shape` 基类、5 个叶子类、`ContainerShape`、`ShapeFactory`                                             | `feat(shapes): shape hierarchy and composite container`                                                                                         | 单测：多态 `move`/`scale`、容器递归、id 唯一          |
| **2**    | `Document`、id 索引、`Command` 接口、`Create`/`Delete`/`Move`、分词器、`init`/`create`/`move`/`delete` | `feat(model): document model and id index`<br>`feat(commands): create, delete and move commands`<br>`feat(cli): command tokenizer and registry` | 作业第 6 节会话前 5 条能原样复现                      |
| **3**    | `CommandHistory`、`undo`/`redo`、io 锁定                                                               | `feat(commands): undo/redo stack with io lockout`                                                                                               | `undo`/`redo` 会话语义一致；`save` 后 undo 报错       |
| **4**    | `group`/`ungroup`/`addto`/`front`/`back`                                                               | `feat(commands): grouping and z-order`                                                                                                          | 自环拒绝、根级 ungroup 拒绝                           |
| **5**    | `set` 白名单、`tree` 树形、`show` 明细、`help`                                                         | `feat(cli): tree/show rendering and set whitelist`                                                                                              | 与作业 5.1/5.2 输出逐字符比对                         |
| **6**    | `SvgReader` / `SvgWriter`、id 补全、warning                                                            | `feat(io): SVG load/save with id auto-assignment`                                                                                               | 作业 `other.svg` 读入结果与 6 节一致；round-trip 无损 |
| **7**    | 12 条错误信息对齐、边界用例                                                                            | `fix(errors): align error message contract`                                                                                                     | 每条错误一个测试                                      |
| **8**    | 文档四节 + PlantUML 图 + 一致性自查                                                                    | `docs: architecture write-up and consistency check`<br>tag `final`                                                                              | `doc/README.md` 四节齐全                              |

时间紧时可以把 4+5 合并、6+7 合并，但**不要**把 1~3 合并成一次提交——那一段正是架构成型的过程，
历史里必须看得见。

## 四、GitHub 操作规范

作业明确要求：git 全程管理、推送远程、历史体现过程、最终提交打 tag。

1. **每个阶段结束就推**，不要攒到最后一次性推：
   ```bash
   git add -A
   git commit -m "feat(shapes): shape hierarchy and composite container"
   git push
   ```
2. **提交信息用 `type(scope): 描述`**，`type` 取 `feat` / `fix` / `refactor` / `test` / `docs` / `chore`。
   不要写 `update`、`修改一下`、`fix bug`。
3. **收尾打 tag，且必须单独推**（`git push` 默认不推 tag，这是最容易丢分的一步）：
   ```bash
   git tag -a final -m "Lab1 Phase 1 final submission"
   git push origin final
   ```
4. **提交前自检**：
   ```bash
   git log --oneline          # 历史是否分步
   git status                 # 是否干净
   npm run verify             # 类型 + lint + 测试
   git ls-remote --tags origin  # 确认 tag 已上远程
   ```
5. 仓库是 public，避免提交 `node_modules`、`dist`、个人路径配置；`.gitignore` 已覆盖。
