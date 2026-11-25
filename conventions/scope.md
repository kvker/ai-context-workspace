# ACW 与 projects 职责边界

> 本文件定义 ACW 与 `projects/` 工作单元的归属边界；与目录说明冲突时以本文件为准。

ACW 是上下文主体，`projects/` 只承载具体业务交付物，两者不是平级的工作区。

| 层 | 负责 | 不负责 |
|----|------|--------|
| ACW（`knowledge/`、`conventions/`、`artifacts/`） | 稳定事实、规范约定、检查证据；任务计划与状态由 `artifacts/` 承载（含方案、排期、决策、评审记录） | 交付物本体 |
| `projects/{unit}`（如代码仓库） | 交付物本体及其强相关变更：代码、测试、构建配置、依赖，以及随交付物演进的 README、API 和架构文档 | 宏观计划、方案、TODO、排期、进度、决策、评审记录、任务状态 |

## 归属规则

- 任务级计划、方案、TODO、排期、进度、决策、评审记录和任务状态写入 `artifacts/{artifact}/`；L0/L1 无 Artifact 时只保留在当轮回复中，不写入 `knowledge/` 或 `projects/`。
- 工作区级、跨工作单元的稳定事实写入 `knowledge/`；跨工作单元规范写入 `conventions/`；长期路线图和跨任务计划按 `artifacts/` 的既有 Artifact 契约管理。
- 只有交付物本体及其强相关变更写入 `projects/{unit}`。
- 判断标准：内容随交付物发布、被交付物直接消费，写入 `projects/`；内容描述“接下来做什么、做到哪一步、为什么这样定”，留在 `artifacts/`；工作区级、跨工作单元的稳定事实和规范分别写入 `knowledge/`、`conventions/`；随交付物演进的 README、API 和架构文档留在 `projects/`。
- 工作单元是 Git 仓库（如 `repos`）不改变归属；代码内 TODO 注释属于交付物本身，可以保留。
- 不得在 `projects/` 子目录新建 TODO、plan、roadmap 一类宏观计划文件。

## 越界处理

发现 `projects/` 中已有宏观计划、方案、TODO、排期、进度、决策、评审记录或任务状态文件时，不静默删除：先报告路径和归属判断，由用户确认后迁移到 `artifacts/`；工作区级、跨工作单元的稳定事实迁移到 `knowledge/`，规范类内容迁移到 `conventions/`。
