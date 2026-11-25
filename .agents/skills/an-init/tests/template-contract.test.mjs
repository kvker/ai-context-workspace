import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const INIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Skill 元数据、目录名和暂存文件保持一致", () => {
  const skills = [INIT, ...fs.readdirSync(path.join(INIT, "assets/skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(INIT, "assets/skills", entry.name))];

  for (const skillDir of skills) {
    const name = path.basename(skillDir);
    const skillFile = skillDir === INIT ? path.join(skillDir, "SKILL.md") : path.join(skillDir, "SKILL.md.txt");
    const metadataFile = path.join(skillDir, "agents/openai.yaml");
    const skill = fs.readFileSync(skillFile, "utf8");
    const metadata = fs.readFileSync(metadataFile, "utf8");
    const declaredName = skill.match(/^name:\s*([a-z0-9-]+)$/m)?.[1];
    const description = metadata.match(/short_description:\s*"([^"]+)"/)?.[1] || "";
    const prompt = metadata.match(/default_prompt:\s*"([^"]+)"/)?.[1] || "";

    assert.equal(declaredName, name, `${name} frontmatter name 不一致`);
    assert.ok(Array.from(description).length >= 25 && Array.from(description).length <= 64, `${name} short_description 长度无效`);
    assert.ok(prompt.includes(`$${name}`), `${name} default_prompt 未显式引用 Skill`);
  }
});

test("an-task 触发机制锁定讨论态到执行态的切换", () => {
  const skill = fs.readFileSync(path.join(INIT, "assets/skills/an-task/SKILL.md.txt"), "utf8");
  const metadata = fs.readFileSync(path.join(INIT, "assets/skills/an-task/agents/openai.yaml"), "utf8");
  const init = fs.readFileSync(path.join(INIT, "SKILL.md"), "utf8");

  // AC-1：发现描述包含进入执行态的触发信号，隐式调用也能命中
  assert.match(skill, /^description:.*“开始吧”.*“实现”.*(执行态|分流).*$/m);

  // AC-2：正文包含逐消息重新分流规则；连续讨论后用户下达开始/实现指令必须进入分流
  assert.match(skill, /## 〇、触发与逐消息重新分流/);
  assert.match(skill, /每收到一条新消息都重新分流/);
  assert.match(skill, /不构成跳过分流的理由|不得因前文/);
  assert.ok(metadata.includes("$an-task"), "an-task 元数据未引用 Skill");

  // AC-3：初始化生成的根 AGENTS 路由要求包含触发规则
  assert.match(init, /an-task.*触发规则|触发规则.*an-task/);
});

test("an-task 规模感知触发机制：小改动不跳过分流、规模膨胀升级", () => {
  const skill = fs.readFileSync(path.join(INIT, "assets/skills/an-task/SKILL.md.txt"), "utf8");
  const flow = fs.readFileSync(path.resolve(INIT, "../../../conventions/flow-policy.md"), "utf8");
  const init = fs.readFileSync(path.join(INIT, "SKILL.md"), "utf8");

  // AC-1：分流判定与建 Artifact 分离；小改动也必须先判定
  assert.match(skill, /分流判定不等于/);
  assert.match(skill, /不允许跳过判定|不允许不判定/);

  // AC-2：L0/L1 客观判据锁定具体数值与层约束（两文档口径一致）
  assert.match(flow, /L0 不超过 1 个/);
  assert.match(flow, /L1 不超过 2 个/);
  assert.match(flow, /不跨前后端/);
  assert.match(skill, /L0 限不超过 1 个文件、L1 限不超过 2 个文件/);

  // AC-3：3 个以上文件或跨前后端 → 至少 L2；两文档阈值与清单一致
  assert.match(flow, /3 个以上文件/);
  assert.match(skill, /3 个以上文件/);
  assert.match(flow, /至少使用 L2/);
  assert.match(skill, /数据迁移/);
  assert.match(skill, /权限或安全边界/);
  assert.match(skill, /多轮迭代/);

  // AC-4：迭代膨胀再评估；两文档 3 轮阈值一致，区分未建仓/已建仓，且已建仓不重复询问建仓
  assert.match(flow, /达 3 轮实质迭代/);
  assert.match(skill, /连续迭代达 3 轮/);
  assert.match(flow, /未建仓任务.*补建 Artifact/);
  assert.match(flow, /含 L1 轻量 Artifact/);
  assert.match(flow, /相应阶段文档/);
  assert.match(skill, /相应阶段文档/);
  assert.match(flow, /不重复询问是否建仓/);
  assert.match(skill, /不重复询问是否建仓/);

  // 根路由要求包含规模规则
  assert.match(init, /an-task.*规模|规模.*an-task/);
});

test("an-init 必须禁止隐式触发", () => {
  const metadata = fs.readFileSync(path.join(INIT, "agents/openai.yaml"), "utf8");
  assert.match(metadata, /allow_implicit_invocation:\s*false/);
});

test("模板初始状态契约有效且不预置个人 Memory", () => {
  const root = path.resolve(INIT, "../../../");
  const index = JSON.parse(fs.readFileSync(path.join(root, "artifacts/index.json"), "utf8"));
  const memories = fs.readdirSync(path.join(root, "conventions/memories"));

  assert.deepEqual(index, { schemaVersion: 1, active: [] });
  assert.deepEqual(memories, ["AGENTS.md"]);
  assert.match(fs.readFileSync(path.join(root, "README.md"), "utf8"), /^<!-- ai-context-workspace-readme -->/);
});

test("ACW 与 projects 职责边界固化在约定并进入初始化产物", () => {
  const root = path.resolve(INIT, "../../../");
  const scope = fs.readFileSync(path.join(root, "conventions/scope.md"), "utf8");
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  const conventionsIndex = fs.readFileSync(path.join(root, "conventions/AGENTS.md"), "utf8");
  const init = fs.readFileSync(path.join(INIT, "SKILL.md"), "utf8");

  assert.match(scope, /不得在 `projects\/` 子目录新建 TODO/);
  assert.match(agents, /conventions\/scope\.md/);
  assert.match(conventionsIndex, /scope\.md/);
  assert.match(init, /conventions\/scope\.md/);
  assert.match(init, /structure\.md.*只承载交付物/);
});

test("knowledge 可维护且已移除只读门禁", () => {
  const root = path.resolve(INIT, "../../../");
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const knowledge = fs.readFileSync(path.join(root, "knowledge/AGENTS.md"), "utf8");
  const init = fs.readFileSync(path.join(INIT, "SKILL.md"), "utf8");
  const task = fs.readFileSync(path.join(INIT, "assets/skills/an-task/SKILL.md.txt"), "utf8");
  const refresh = fs.readFileSync(path.join(INIT, "assets/skills/an-refresh/SKILL.md.txt"), "utf8");
  const projects = fs.readFileSync(path.join(root, "projects/AGENTS.md"), "utf8");

  // 目录改名完成，旧目录不再存在
  assert.equal(fs.existsSync(path.join(root, "background")), false, "旧 background 目录应已移除");
  assert.match(agents, /\[knowledge\]\(knowledge\/\)/);
  assert.match(readme, /knowledge\//);
  assert.doesNotMatch(readme, /background\//);

  // 只读门禁已移除，知识可由 AI 持续维护
  assert.match(agents, /AI 可持续维护/);
  assert.match(agents, /不设只读门禁/);
  assert.doesNotMatch(agents, /任务默认只读/);
  assert.doesNotMatch(knowledge, /不主动修改本目录/);
  assert.doesNotMatch(init, /任务默认只读/);
  assert.doesNotMatch(task, /任务执行期间不修改/);
  assert.doesNotMatch(task, /不得在归档前直接修改/);

  // 知识写入不再只依赖刷新流程
  assert.match(task, /执行中发现的稳定事实可按 `knowledge\/AGENTS\.md` 增量写回/);
  assert.match(refresh, /不是本流程的专属权限/);
  assert.match(refresh, /knowledge-scan\.json/);
  assert.doesNotMatch(refresh, /background-scan\.json/);

  const scope = fs.readFileSync(path.join(root, "conventions/scope.md"), "utf8");
  const principles = fs.readFileSync(path.join(root, "conventions/principles.md"), "utf8");
  const workflow = fs.readFileSync(path.join(root, "conventions/workflow.md"), "utf8");
  const flowPolicy = fs.readFileSync(path.join(root, "conventions/flow-policy.md"), "utf8");
  const conventionsIndex = fs.readFileSync(path.join(root, "conventions/AGENTS.md"), "utf8");

  // 边界、证据门槛与显式范围例外必须被锁定
  assert.match(knowledge, /不存放交付物本体，交付物写入 `projects\/`/);
  assert.match(knowledge, /规范正文变更需显式更新/);
  assert.match(knowledge, /Artifact 作为二手线索时/);
  assert.match(knowledge, /用户明确限定只读/);
  assert.match(agents, /用户明确限定只读或范围时遵守该范围/);
  assert.match(task, /任何等级在写入 `knowledge\/` 前/);
  assert.match(refresh, /任务内直接观察到的事实不受此限/);
  assert.match(init, /`acceptable: true` 证据门槛/);
  assert.match(knowledge, /有来源但尚未确认的内容/);
  assert.match(knowledge, /无来源的猜测/);
  assert.match(knowledge, /acceptable: true/);
  assert.match(task, /知识写回不依赖归档完成/);

  // 任务过程归属和分层约定必须被锁定
  assert.match(task, /留在 Artifact（如存在）/);
  assert.match(agents, /L0\/L1 无 Artifact 时只保留在当轮回复中/);
  assert.match(knowledge, /L0\/L1 无 Artifact 时只保留在当轮回复中/);
  assert.match(agents, /长期路线图与跨任务计划按 `artifacts\/` 既有契约管理/);
  assert.match(knowledge, /“直接观察”指当前 `projects\/` 材料/);
  assert.match(refresh, /他人或非当前任务的未归档 Artifact 中的记录仍按二手线索处理/);
  assert.match(scope, /任务级计划、方案、TODO、排期、进度、决策、评审记录和任务状态写入 `artifacts\/\{artifact\}\//);
  assert.match(scope, /工作区级、跨工作单元的稳定事实迁移到 `knowledge\/`/);
  assert.match(scope, /长期路线图和跨任务计划按 `artifacts\/` 的既有 Artifact 契约管理/);
  assert.match(principles, /事实与规范分层/);
  assert.match(workflow, /工作区级、跨工作单元的稳定事实写入 `knowledge\/`/);

  // conventions 写入边界、事实来源与项目文档归属
  assert.match(agents, /对话记忆按 `rules.md` 的机制写入 `conventions\/memories\/`，规范正文需显式变更/);
  assert.match(agents, /当前任务的实际执行观察/);
  assert.match(readme, /随交付物演进的 README、API 和架构文档仍留在 `projects\/`/);
  assert.match(workflow, /随交付物演进的 README、API 和架构文档仍按/);
  assert.match(projects, /随交付物演进的 README、API 和架构文档仍留在本目录/);
  assert.match(scope, /工作区级、跨工作单元的稳定事实/);
  assert.match(knowledge, /INVALID_ARTIFACT_INDEX/);
  assert.match(refresh, /显式更新入口/);

  // 生成契约与前置检查
  assert.match(init, /计划、方案、TODO、排期、进度、评审记录、决策和任务状态归 `artifacts\/`/);
  assert.match(init, /L0\/L1 无 Artifact 时只保留在当轮回复中/);
  assert.match(init, /diagnostics 索引异常检查/);
  assert.match(init, /宏观计划、方案、待办、排期、进度、决策、评审记录和任务状态归 `artifacts\/`/);
  assert.match(init, /knowledge\/overview\.md/);
  assert.match(init, /knowledge\/workspaces\.md/);
  assert.match(init, /可增量写入/);
  assert.match(knowledge, /计划、方案、TODO、排期、进度、决策、评审记录和任务状态不写入本目录/);
  assert.match(agents, /访问某个目录时，先检查该目录及其相关父级路径中的 `AGENTS\.md`/);
  assert.match(flowPolicy, /但不触发文件数、跨层、新增文件、修改长期保存的数据或多轮迭代类 L2 条件/);
  assert.match(refresh, /无论用户要求还是 AI 判断必要时运行/);
  assert.match(conventionsIndex, /`knowledge\/` 存工作区事实，本目录存协作规范/);
  assert.match(task, /知识维护（读取或增量写入 `knowledge\/`）不计入文件数、跨层、新增文件、长期数据或多轮迭代类规模判据/);
  assert.match(init, /知识维护不计入文件数、跨层、新增文件、长期数据或多轮迭代类规模判据/);
  assert.match(knowledge, /需要理解工作区事实时，按需读取相关文档/);
  assert.match(knowledge, /随交付物演进的 README、API 和架构文档也留在 `projects\/`/);
  assert.match(init, /工作区级事实写入 `knowledge\/`，协作规范写入 `conventions\/`/);
  assert.match(init, /已存在与 `assets\/skills` 同名（`an-task`、`an-task-split`、`an-recipes`、`an-refresh`、`an-review`、`an-archive`）的运行期 Skill/);
  assert.match(refresh, /archivedReviews\.items\[\]\.acceptable: true/);
  assert.match(refresh, /有来源但未确认的推断只进入“待确认”分区/);
  assert.match(refresh, /用户明确限定只读、审查或范围时不得更新规范正文/);
  assert.match(agents, /需要时按需读取/);
  assert.match(workflow, /进度、决策、评审记录和任务状态属于任务上下文/);
  assert.match(scope, /随交付物演进的 README、API 和架构文档留在 `projects\/`/);
  assert.match(fs.readFileSync(path.join(root, "artifacts/AGENTS.md"), "utf8"), /已归档 Artifact 保持只读/);
  assert.match(task, /已归档项保持只读/);

  // 决策/评审记录排除与归档二手线索来源
  assert.match(projects, /决策、评审记录或任务状态/);
  assert.match(readme, /计划、方案、TODO、排期、进度、决策和评审记录留在 `artifacts\/`/);
  assert.match(agents, /经 `an-refresh` 扫描确认 `acceptable: true` 且 `diagnostics` 无索引错误的已归档 Artifact/);
  assert.match(readme, /经 `an-refresh` 扫描确认 `acceptable: true` 且 `diagnostics` 无索引错误的已归档 Artifact/);
  assert.match(knowledge, /工作区级事实（含工作单元清单与关系）和跨工作单元事实/);
  assert.match(init, /必须保留按需读取、用户明确限定只读或范围时遵守该范围的规则/);
  assert.match(init, /工作单元清单与关系（工作区级索引，不是交付物文档）/);
  assert.match(scope, /任务计划与状态由 `artifacts\/` 承载（含方案、排期、决策、评审记录）/);
  assert.match(scope, /宏观计划、方案、TODO、排期、进度、决策、评审记录、任务状态/);
  assert.match(refresh, /都必须在本轮回复中列出变更点、来源和范围/);
  assert.match(init, /写入标注来源/);
  assert.match(init, /任务内写入后报告变更\/来源\/待确认/);
  assert.match(init, /无来源不写入/);
  assert.match(init, /`\$an-refresh` 不是唯一入口/);
  assert.match(init, /实际工作单元清单、路径和关系只写 `knowledge\/workspaces\.md`/);
  assert.match(init, /评审记录、决策和任务状态归 `artifacts\/`/);
  assert.match(knowledge, /AI 可在任务执行、初始化或刷新过程中持续维护本目录/);
  assert.doesNotMatch(knowledge, /默认只读|仅由.*(初始化|刷新).*更新/);
  assert.match(init, /AI 可在任务中发现稳定事实时主动更新/);
  assert.match(scope, /L0\/L1 无 Artifact 时只保留在当轮回复中/);
  assert.match(workflow, /评审记录和任务状态属于任务上下文/);
  assert.match(agents, /`diagnostics` 无索引错误/);
  assert.match(readme, /`diagnostics` 无索引错误/);
  assert.match(refresh, /不复制旧目录名、旧只读门禁或旧证据规则/);
  assert.match(scope, /宏观计划、方案、TODO、排期、进度、决策、评审记录或任务状态文件/);
});

test("结构性文档和运行期 Skill 不再引用旧知识目录", () => {
  const root = path.resolve(INIT, "../../../");
  const self = path.join(INIT, "tests/template-contract.test.mjs");
  const targets = [
    path.join(root, "projects/AGENTS.md"),
    path.join(root, "artifacts/AGENTS.md"),
    path.join(INIT, "SKILL.md"),
    path.join(INIT, "agents/openai.yaml"),
  ];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) targets.push(path.join(root, entry.name));
  }

  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collect(full);
        continue;
      }
      if (full !== self && /\.(md|txt|mjs|yaml|yml|json)$/.test(entry.name)) targets.push(full);
    }
  };

  collect(path.join(root, "conventions"));
  collect(path.join(root, "knowledge"));
  collect(path.join(INIT, "assets/skills"));
  collect(path.join(INIT, "scripts"));
  collect(path.join(INIT, "tests"));

  const offenders = [];
  for (const file of targets) {
    fs.readFileSync(file, "utf8").split("\n").forEach((line, index) => {
      const isLegacyRef = /background(?!-(?:color|image|size|position|repeat|attachment|clip|origin|blend))/i.test(line);
      if (isLegacyRef) offenders.push(`${path.relative(root, file)}:${index + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});
