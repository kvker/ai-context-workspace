# AI Context Workspace

这是一个通用的 AI Context Workspace，用于为任意类型的 AI 协作任务提供结构化上下文。

> **缩写说明**：对话中出现的“ACW”一般指 AI Context Workspace 的缩写；`an-*` 是保留的运行期 Skill 命名空间。

## 工作区定位

本工作区不预设任务类型。它既可以承载代码开发，也可以承载文档写作、方案设计、数据分析、研究整理、内容创作、流程规划等任何需要多轮 AI 协作的任务。

核心目标：让 AI 在一致的上下文结构中理解目标、规范、知识和任务状态，减少重复沟通，提升协作质量。

## 模板结构

| 目录 | 用途 | AI 行为 |
|------|------|---------|
| [knowledge](knowledge/) | 工作区稳定事实与可复用知识 | 需要时按需读取；AI 可持续维护，发现稳定事实即可增量写入，不设只读门禁 |
| [conventions](conventions/) | 上下文约定规范、对话长期规则与优化记录 | 开始任务前按需读取；对话记忆按 `rules.md` 的机制写入 `conventions/memories/`，规范正文需显式变更 |
| [artifacts](artifacts/) | 任务上下文：计划、待办、决策、进度、检查证据与任务状态 | 按任务需要读写；实际交付物只保存引用 |
| [projects](projects/) | 具体业务交付物根目录，每个子目录为一个独立工作单元 | 只写与交付物强相关的变更；宏观计划、TODO 和任务状态不写在此 |
| [.agents/skills/an-init](.agents/skills/an-init/) | 模板初始化技能，运行期技能暂存在其 `assets/skills/` 中 | 模板阶段的入口技能；运行期技能以 `SKILL.md.txt` 暂存，模板阶段不可见；`$an-init` 完成后恢复文件名并移入 `.agents/skills/`，an-init 自身删除 |

> `projects/` 在本模板中被视为**工作区根目录**，子目录可以是代码工程、文档集、数据集、设计稿目录或任何需要被 AI 理解和操作的交付物集合。

## ACW 与 projects 的职责边界

ACW 是上下文主体，`projects/` 只承载具体业务交付物，两者不是平级的工作区。

- 计划、方案、TODO、排期、进度、评审记录、决策和任务状态属于 ACW：任务级写入 `artifacts/`，长期路线图与跨任务计划按 `artifacts/` 既有契约管理；工作区级、跨工作单元的稳定事实写入 `knowledge/`；跨工作单元规范写入 `conventions/`。
- `projects/{unit}` 只写交付物本体及强相关变更（代码、测试、构建配置、随交付物演进的文档）；Git 仓库不改变归属。
- 不得在 `projects/` 子目录新建 TODO、plan、roadmap 一类宏观计划文件。

完整规则见 [scope](conventions/scope.md)。

## 约定

索引文件以路由和必要约束为主，不复制具体文档正文：`[name](path/to/file)`

## AI 行为约束

- 禁止自行脑补未提及的需求、功能或业务逻辑。
- 访问某个目录时，先检查该目录及其相关父级路径中的 `AGENTS.md`（如存在），再读取或修改其中的文件；不要为此主动遍历无关目录。
- 所有知识必须来自实际材料、用户明确输入、当前任务的实际执行观察，或经 `an-refresh` 扫描确认 `acceptable: true` 且 `diagnostics` 无索引错误的已归档 Artifact（二手线索）。
- `knowledge/` 由 AI 持续维护；写入须标注来源、区分已确认与待确认；任务过程不写入 `knowledge/`，有 Artifact 时写入 `artifacts/`，L0/L1 无 Artifact 时只保留在当轮回复中；用户明确限定只读或范围时遵守该范围。
- 从工作区材料反推的信息要标注来源；无法确认的信息标记为“待确认”。
- 不主动读取或输出 `.env`、`secrets/`、credentials、密钥、token 等敏感文件；除非用户明确授权且任务必要。

## 必读规范

开始任务前按需读取以下规范：

| 规范 | 用途 |
|------|------|
| [principles](conventions/principles.md) | AI Context Workspace 核心原则 |
| [scope](conventions/scope.md) | ACW 与 `projects/` 的职责边界 |
| [workflow](conventions/workflow.md) | 标准工作流 |
| [flow-policy](conventions/flow-policy.md) | 流程轻重判断 |
| [document](conventions/document.md) | 文档编写规范 |
| [rules](conventions/rules.md) | 对话过程中的长期记忆感知与沉淀 |
| [memories](conventions/memories/AGENTS.md) | 对话优化记录索引 |

## 任务状态

活跃 Artifact 的唯一索引是 [artifacts/index.json](artifacts/index.json)。根 `AGENTS.md` 不复制动态任务状态，避免任务执行修改高优先级指令文件。

每个 Artifact 的流程等级、生命周期状态和父任务 ID 记录在自身的 `artifact.json`；Review 结论记录在 `review/review.json`。字段契约见 [workflow](conventions/workflow.md)。

## Skill 路由

当前处于模板阶段，唯一入口是 `$an-init`。支持 Slash Command 的客户端也可以使用 `/an-init`。

运行期 Skills 现在仅以 `SKILL.md.txt` 保存，不应提前路由或调用。初始化完成并重启客户端后，根 `AGENTS.md` 必须改为运行期 Skill 路由，并移除 `an-init` 入口。
