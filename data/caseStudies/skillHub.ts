import type { CaseStudyEntry } from './types';

const skillHub: CaseStudyEntry = {
  projectId: 'skillHub',
  started: '2026',
  links: [
    {
      kind: 'source',
      href: 'https://github.com/CassianFlorin/skill-hub',
      label: { zh: 'GitHub 源码', en: 'Source on GitHub' },
    },
    {
      kind: 'site',
      href: 'https://github.com/CassianFlorin/skill-hub-registry',
      label: { zh: '官方技能目录', en: 'Official registry' },
    },
  ],
  relatedPostSlugs: ['20260526-codegraph-agent-coding'],
  content: {
    en: {
      summary:
        'A package manager that treats agent Skills as versioned, installable packages.',
      why: [
        'Coding agents became part of daily work, and each of them learned to load reusable Skills. The Skills themselves, though, lived as copied folders — in repositories, in home directories, in four different runtime layouts.',
        'Once a Skill is copied, nobody knows which version is running, where it came from, or how to undo a bad change. skill-hub exists to give Skills the lifecycle that code packages already have.',
      ],
      problem: [
        'No single source of truth: the same Skill drifts apart across Codex, Claude, Gemini and Hermes directories.',
        'No versions or history: an update overwrites a folder and leaves nothing to roll back to.',
        'No discovery: finding a Skill means already knowing its repository path.',
        "Unsafe by default: writing straight into an agent's runtime directory changes its behaviour immediately.",
      ],
      system: {
        intro:
          'skill-hub separates where a Skill is managed from where an agent loads it. Three layers, each with one job.',
        layers: [
          {
            title: 'Registry',
            body: 'Local or Git-backed indexes (`skillhub.index.json`, schema v2) that describe what can be installed.',
          },
          {
            title: 'Managed store',
            body: 'Installed packages under `$SKILLHUB_HOME`, pinned in `skillhub.lock` with version, checksum, source ref and history. Updates and rollbacks happen here.',
          },
          {
            title: 'Runtime copy',
            body: 'Explicit deploys into the Codex, Claude, Gemini or Hermes skills directory — the only layer an agent actually reads.',
          },
        ],
      },
      implementation: [
        {
          title: 'One Go binary, plus a TUI',
          body: 'Setup, registries, discovery, lifecycle, deploy, publishing and audit live in a single CLI, with an interactive `skillhub tui` on top.',
        },
        {
          title: 'Package format',
          body: '`skill.yaml` declares name, namespace, version, entry and targets. Folders with only a `SKILL.md` still install — skill-hub generates the metadata for them.',
        },
        {
          title: 'Lockfile and history',
          body: '`skillhub.lock` records checksums and source refs, so installs are reproducible and `rollback` always has somewhere to return to.',
        },
        {
          title: 'Static catalog',
          body: '`catalog export` writes `index.html` and `catalog.json`, so a registry can be browsed without running a server.',
        },
        {
          title: 'Distribution',
          body: 'Released through Homebrew, npm and `go install`, with an npm tarball attached to every tagged release for pinning or mirroring.',
        },
      ],
      decisions: [
        {
          title: 'Updating never touches the runtime',
          body: '`skillhub update` changes the managed store only. Replacing what an agent loads takes an explicit `deploy … --force`, so an upgrade can never silently change how an agent behaves.',
        },
        {
          title: 'Semver is enforced, not suggested',
          body: 'Patch and minor updates apply automatically. Major bumps and versions marked `compatibility.breaking` are skipped until you pass `--major`, and `requires.skillhub` refuses installs the CLI cannot support.',
        },
        {
          title: 'Discovered is not adopted',
          body: 'Skills already sitting in project folders appear in `list` and the TUI, but are never pulled into the managed store behind your back.',
        },
        {
          title: 'A registry is just files',
          body: 'An index in a directory or a Git repository is enough. Sharing Skills inside a team needs no hosted service.',
        },
      ],
      result: {
        facts: [
          { label: 'Release line', value: 'v1.4.x' },
          { label: 'Runtimes', value: 'Codex · Claude · Gemini · Hermes' },
          { label: 'Install', value: 'Homebrew · npm · Go' },
        ],
        notes: [
          'The v1.4 line added publishing (including a fork-and-PR flow), compatibility enforcement, a confirmation policy for major updates, and a local audit log. The official catalog lives in skill-hub-registry.',
          'Registry signing and trust policy are reserved for v1.5.',
        ],
      },
    },
    zh: {
      summary: '把 Agent 技能当作有版本、可安装的包来管理的包管理器。',
      why: [
        '编程 Agent 进入了日常开发，每一个都学会了加载可复用的技能（Skill）。可技能本身还是被复制来复制去的文件夹：散在仓库里、家目录里，以及四种不同的运行时目录结构里。',
        '技能一旦被复制，就没人说得清正在运行的是哪个版本、从哪来的、改坏了怎么撤回。skill-hub 要做的，是给技能补上代码包早就有的生命周期。',
      ],
      problem: [
        '没有唯一来源：同一个技能在 Codex、Claude、Gemini、Hermes 的目录里各自漂移。',
        '没有版本和历史：一次更新直接覆盖文件夹，出了问题无处回滚。',
        '无法发现：想找一个技能，得事先知道它的仓库路径。',
        '默认不安全：直接写进 Agent 的运行时目录，会立刻改变它的行为。',
      ],
      system: {
        intro:
          'skill-hub 把「技能在哪里被管理」和「Agent 从哪里加载」拆开。三层，每层只负责一件事。',
        layers: [
          {
            title: 'Registry 索引',
            body: '本地或 Git 托管的索引（`skillhub.index.json`，schema v2），描述有哪些技能可以安装。',
          },
          {
            title: '托管存储',
            body: '安装在 `$SKILLHUB_HOME` 下的包，由 `skillhub.lock` 锁定版本、校验和、来源与历史。更新和回滚都发生在这一层。',
          },
          {
            title: '运行时副本',
            body: '显式部署到 Codex、Claude、Gemini 或 Hermes 的技能目录，这是 Agent 真正读取的唯一一层。',
          },
        ],
      },
      implementation: [
        {
          title: '一个 Go 二进制，外加 TUI',
          body: '初始化、索引、发现、生命周期、部署、发布和审计都在同一个 CLI 里，上面再加一个交互式的 `skillhub tui`。',
        },
        {
          title: '包格式',
          body: '`skill.yaml` 声明名称、命名空间、版本、入口和目标运行时。只有 `SKILL.md` 的旧文件夹也能安装，skill-hub 会为它生成元数据。',
        },
        {
          title: '锁文件与历史',
          body: '`skillhub.lock` 记录校验和与来源引用，安装可复现，`rollback` 永远有地方可退。',
        },
        {
          title: '静态目录',
          body: '`catalog export` 导出 `index.html` 和 `catalog.json`，不用跑服务就能浏览一个索引。',
        },
        {
          title: '分发',
          body: '通过 Homebrew、npm 和 `go install` 发布，每个 tag 版本还附带 npm tarball，方便锁定或镜像。',
        },
      ],
      decisions: [
        {
          title: '更新永远不碰运行时',
          body: '`skillhub update` 只修改托管存储。要替换 Agent 实际加载的副本，必须显式执行 `deploy … --force`，升级不会悄悄改变 Agent 的行为。',
        },
        {
          title: '语义化版本是强制的，不是建议',
          body: 'patch 和 minor 更新自动应用；major 升级和标记了 `compatibility.breaking` 的版本会被跳过，直到你传入 `--major`。`requires.skillhub` 会拒绝当前 CLI 无法支持的安装。',
        },
        {
          title: '被发现不等于被接管',
          body: '项目目录里已有的技能会出现在 `list` 和 TUI 里，但绝不会被偷偷纳入托管存储。',
        },
        {
          title: 'Registry 就是文件',
          body: '一个目录或一个 Git 仓库里的索引文件就够了，团队内部共享技能不需要任何托管服务。',
        },
      ],
      result: {
        facts: [
          { label: '版本线', value: 'v1.4.x' },
          { label: '运行时', value: 'Codex · Claude · Gemini · Hermes' },
          { label: '安装方式', value: 'Homebrew · npm · Go' },
        ],
        notes: [
          'v1.4 版本线加入了发布能力（含 fork-and-PR 流程）、兼容性约束、major 更新确认策略和本地审计日志。官方技能目录放在 skill-hub-registry。',
          'Registry 签名与信任策略留给 v1.5。',
        ],
      },
    },
  },
};

export default skillHub;
