import type { CaseStudyEntry } from './types';

const databaseCli: CaseStudyEntry = {
  projectId: 'databaseCli',
  started: '2026',
  links: [
    {
      kind: 'source',
      href: 'https://github.com/CassianFlorin/database-cli',
      label: { zh: 'GitHub 源码', en: 'Source on GitHub' },
    },
    {
      kind: 'site',
      href: 'https://cassianflorin.github.io/database-cli/',
      label: { zh: '项目主页', en: 'Project site' },
    },
  ],
  content: {
    en: {
      summary:
        'A CLI-first database Skill that lets agents investigate real data inside guardrails.',
      why: [
        'Production debugging keeps coming back to the database: which table holds this, which column changed, what does this order actually look like in QA?',
        'Agents are good at that loop. Handing one a general-purpose database client is the wrong trade, though. database-cli gives the agent one narrow, auditable way in.',
      ],
      problem: [
        "Agents guess at schema instead of reading it, and write SQL against tables that don't exist.",
        'A general SQL client lets every statement through, writes and DDL included.',
        'Connection details end up in command lines and chat history.',
        "Each environment is set up differently, so humans and agents don't share one entry point.",
      ],
      system: {
        intro:
          'The CLI is the product. Everything else is a thin layer on top of it.',
        layers: [
          {
            title: 'Skill · SKILL.md',
            body: 'The operating procedure: confirm the environment, read the real schema, run bounded read-only queries, and change data only with explicit approval.',
          },
          {
            title: 'Optional MCP adapter',
            body: '`scripts/database-mcp` exposes the same capabilities over stdio MCP and delegates every call to the CLI.',
          },
          {
            title: 'CLI · scripts/db-query',
            body: 'The single execution entry. It validates SQL, enforces read-only defaults and row limits, and searches metadata.',
          },
          {
            title: 'sq backend',
            body: 'Queries run through `sq`, with environments described in a local `connections.local.json` that never enters the repository.',
          },
        ],
      },
      implementation: [
        {
          title: 'Setup status an agent can act on',
          body: '`--setup-status` returns JSON with `ready`, problems and `next_actions` — without connecting to any database — so an agent can repair its own setup first.',
        },
        {
          title: 'Object search',
          body: 'Find schemas, tables, columns, indexes and procedures by pattern at `names`, `summary` or `full` detail, instead of hand-writing information_schema SQL.',
        },
        {
          title: 'Connections with intent',
          body: 'Environments carry a display name, project, description and aliases, so the agent can choose a connection by what the user means.',
        },
        {
          title: 'One-step install',
          body: '`scripts/install` checks for `sq`, collects connection details and writes the local config in a single command.',
        },
      ],
      decisions: [
        {
          title: 'One execution path',
          body: 'The MCP adapter is not allowed its own query logic. Safety rules live in the CLI, so no client can route around them.',
        },
        {
          title: 'Write access comes from config, not a flag',
          body: '`--allow-write` only works on environments marked `"writable": true`; ad-hoc connections need an extra `--writable`. A protected database cannot be re-entered as a temporary connection to escape its config.',
        },
        {
          title: 'Count before changing',
          body: 'Approved UPDATE and DELETE statements count affected rows first and are refused above `max_write_rows` (1000 by default), so a `WHERE 1=1` cannot slip through.',
        },
        {
          title: 'Some SQL is never allowed',
          body: 'DDL, privileges, transactions, procedures, locks and exports stay blocked even when writes are approved.',
        },
        {
          title: 'Not a platform',
          body: 'No workbench, permission service or multi-tenant server. It stays a Skill that humans and agents install and can audit.',
        },
      ],
      result: {
        facts: [
          { label: 'Entry point', value: 'scripts/db-query' },
          { label: 'Default', value: 'Read-only · bounded rows' },
          { label: 'Clients', value: 'Codex Skill · MCP' },
        ],
        notes: [
          'It is the database entry point of my own agent setup: schema lookups, cross-environment checks and repair SQL all go through the same guarded CLI.',
        ],
      },
    },
    zh: {
      summary: 'CLI 优先的数据库技能，让 Agent 在护栏内排查真实数据。',
      why: [
        '生产排查总会绕回数据库：这个字段在哪张表、哪一列变了、这笔订单在 QA 环境里到底长什么样。',
        'Agent 很擅长这种来回查证。但直接给它一个通用数据库客户端并不划算。database-cli 给 Agent 的是一个收窄的、可审计的入口。',
      ],
      problem: [
        'Agent 靠猜而不是读 schema，经常对着不存在的表写 SQL。',
        '通用 SQL 客户端什么语句都放行，包括写入和 DDL。',
        '连接信息散落在命令行和聊天记录里。',
        '每个环境配置方式都不一样，人和 Agent 没有共用的入口。',
      ],
      system: {
        intro: 'CLI 就是产品本体，其余的都是它上面的薄层。',
        layers: [
          {
            title: 'Skill · SKILL.md',
            body: '使用规范：先确认环境、读取真实 schema、执行有界只读查询，只有得到明确允许才改数据。',
          },
          {
            title: '可选 MCP 适配层',
            body: '`scripts/database-mcp` 通过 stdio MCP 暴露同一套能力，每一次调用都委托给 CLI。',
          },
          {
            title: 'CLI · scripts/db-query',
            body: '唯一的真实执行入口：校验 SQL、强制只读默认值和行数上限、检索元数据。',
          },
          {
            title: 'sq 后端',
            body: '查询通过 `sq` 执行，环境配置写在本地的 `connections.local.json`，不进仓库。',
          },
        ],
      },
      implementation: [
        {
          title: 'Agent 能直接处理的安装状态',
          body: '`--setup-status` 返回包含 `ready`、问题列表和 `next_actions` 的 JSON，且不连接任何数据库，Agent 可以先自己修好配置。',
        },
        {
          title: '对象搜索',
          body: '按模式搜索 schema、表、列、索引和存储过程，支持 `names`、`summary`、`full` 三档详情，不用手写 information_schema SQL。',
        },
        {
          title: '带意图的连接',
          body: '环境可以配置显示名、项目、描述和别名，Agent 能按用户的意思选对连接。',
        },
        {
          title: '一步安装',
          body: '`scripts/install` 检查 `sq`、收集连接信息并写入本地配置，一条命令完成。',
        },
      ],
      decisions: [
        {
          title: '只有一条执行路径',
          body: 'MCP 适配层不允许有自己的查询逻辑。安全规则都在 CLI 层，任何客户端都绕不过去。',
        },
        {
          title: '写权限由配置声明，不由参数声明',
          body: '只有标记了 `"writable": true` 的环境才接受 `--allow-write`；临时连接还需要额外的 `--writable`。受保护的库无法改用临时连接来绕过配置。',
        },
        {
          title: '改之前先数',
          body: '已批准的 UPDATE、DELETE 会先 COUNT 实际影响行数，超过 `max_write_rows`（默认 1000）直接拒绝，`WHERE 1=1` 这种语句混不过去。',
        },
        {
          title: '有些 SQL 永远不放行',
          body: 'DDL、权限、事务、存储过程、锁和导出，即使批准了写入也依然拦截。',
        },
        {
          title: '不做平台',
          body: '不做 Workbench、权限平台或多租户服务。它始终是一个人和 Agent 都能安装、能审计的技能。',
        },
      ],
      result: {
        facts: [
          { label: '执行入口', value: 'scripts/db-query' },
          { label: '默认行为', value: '只读 · 有界行数' },
          { label: '客户端', value: 'Codex Skill · MCP' },
        ],
        notes: [
          '它是我自己 Agent 工作流里的数据库入口：查 schema、跨环境核对、产出修数 SQL，都走同一个带护栏的 CLI。',
        ],
      },
    },
  },
};

export default databaseCli;
