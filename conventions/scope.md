# ACW 与 projects 职责边界

> 本文件定义 ACW 与 `projects/` 工作单元的归属边界；与目录说明冲突时以本文件为准。

ACW 是上下文主体，`projects/` 只承载具体业务交付物，两者不是平级的工作区。

| 层 | 负责 | 不负责 |
|----|------|--------|
| ACW（`background/`、`conventions/`、`artifacts/`） | 目标、计划、方案、待办、排期、进度、决策、检查证据和任务状态 | 交付物本体 |
| `projects/{unit}`（如代码仓库） | 交付物本体及其强相关变更：代码、测试、构建配置、依赖，以及随交付物演进的 README、API 和架构文档 | 宏观计划、TODO、排期、进度、评审记录、任务状态 |

## 归属规则

- 任务级计划、方案、TODO、进度和任务状态写入 `artifacts/{artifact}/`。
- 长期稳定的路线图和跨工作单元约定写入 `background/` 或 `conventions/`。
- 只有交付物本体及其强相关变更写入 `projects/{unit}`。
- 判断标准：内容随交付物发布、被交付物直接消费，写入 `projects/`；内容描述“接下来做什么、做到哪一步、为什么这样定”，留在 ACW。
- 工作单元是 Git 仓库（如 `repos`）不改变归属；代码内 TODO 注释属于交付物本身，可以保留。
- 不得在 `projects/` 子目录新建 TODO、plan、roadmap 一类宏观计划文件。

## 越界处理

发现 `projects/` 中已有宏观计划、TODO 或任务状态文件时，不静默删除：先报告路径和归属判断，由用户确认后迁移到 `artifacts/` 或 `background/`。
