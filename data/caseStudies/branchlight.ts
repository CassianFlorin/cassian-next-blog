import type { CaseStudyEntry } from './types';

const branchlight: CaseStudyEntry = {
  projectId: 'branchlight',
  started: '2026',
  links: [
    {
      kind: 'download',
      href: 'https://github.com/CassianFlorin/branchlight-app/releases/latest',
      label: { zh: '下载 macOS 版', en: 'Download for macOS' },
    },
  ],
  content: {
    en: {
      summary:
        'A quieter Git desktop client for macOS, built around a clear commit graph, useful diffs and careful three-way conflict resolution.',
      why: [
        "Most of my Git time is not typing commands. It is understanding how branches relate, reviewing what changed, and resolving conflicts without losing either side's work.",
        'Branchlight is a client for exactly those three jobs, with one priority order: Git correctness and a useful GUI first, lightness second.',
      ],
      problem: [
        'Conflict markers in a text editor make it easy to keep one side by accident and lose the other.',
        'Discarding changes, hard resets and force pushes are one click away from losing work, with no way back.',
        'Comparing a task branch against its target mixes in local edits and changes that only exist on the target.',
        'A GUI that reimplements Git can quietly disagree with Git about what the repository looks like.',
      ],
      system: {
        intro:
          'Branchlight keeps Git operations in one Rust engine and lets each platform own its own interface.',
        layers: [
          {
            title: 'Native macOS client',
            body: 'SwiftUI and AppKit for Changes, History and the merge editor. Editor selection, layout and undo belong to macOS; no embedded web editor stands in for it.',
          },
          {
            title: 'C ABI bridge',
            body: '`branchlight-native` owns repository sessions, validates each request once and returns the same JSON models as the original Tauri host. Reads share access; mutations are exclusive.',
          },
          {
            title: 'Git engine',
            body: '`branchlight-core` runs official Git with explicit argument arrays and no shell interpolation, and holds the review rules shared by every client.',
          },
        ],
      },
      implementation: [
        {
          title: 'Three-way merge beside the code',
          body: 'Index stages 1/2/3 are read with `git ls-files --unmerged` and `git cat-file`. The result starts from Base only inside unresolved ranges; arrows accept a side, × dismisses it, and undo restores text and decisions together.',
        },
        {
          title: 'Save is not resolve',
          body: 'Saving checks a fingerprint of the file and its unmerged index entries, and rejects stale writes. "Mark resolved" (`git add`) is a separate, explicit step.',
        },
        {
          title: 'Hunk and line staging',
          body: "Stage, unstage or discard per hunk or per line, built on Git's own diff and `git apply`. Discards are backed up in the Git directory first and can be restored.",
        },
        {
          title: 'A history you can read',
          body: 'A compact commit table with a lane graph, virtual scrolling and automatic paging. Filters run in `git log` over the whole repository, and interactive rebase works by drag or keyboard.',
        },
        {
          title: 'Distribution',
          body: 'A version tag builds, signs, notarizes and publishes the DMG in GitHub Actions; installs update in place through Sparkle.',
        },
      ],
      decisions: [
        {
          title: 'Official Git as the backend',
          body: 'Branchlight drives the real `git` binary instead of a reimplementation, so it never disagrees with the command line about the repository.',
        },
        {
          title: 'Destructive actions need explicit consent',
          body: 'Force push only goes out as `--force-with-lease` pinned to the last fetched value, hard reset refuses to overwrite untracked files, and worktree removal never forces.',
        },
        {
          title: 'No credentials of its own',
          body: 'Remote operations use the existing Git credential helpers and SSH agents. Branchlight has no sign-in flow and stores no passwords.',
        },
        {
          title: 'Native on the Mac',
          body: 'From 0.8.0 the macOS app moved from the Tauri/React client to SwiftUI and AppKit on the same engine. Windows keeps the Tauri client and is paused for now.',
        },
      ],
      result: {
        facts: [
          { label: 'Release', value: 'v0.8.7' },
          { label: 'Platform', value: 'macOS · Apple silicon' },
          { label: 'Engine', value: 'Rust + official Git' },
        ],
        notes: [
          'It is in a daily-use phase: I do all my own Git work in it — rebase, cherry-pick, large diffs, conflicts, worktrees — and fix the friction I hit in small batches.',
          'Windows support is paused; the Tauri client remains on the same engine.',
        ],
      },
    },
    zh: {
      summary:
        '一个安静一点的 macOS Git 客户端，围绕清晰的提交图、有用的 diff 和谨慎的三方冲突解决来做。',
      why: [
        '我花在 Git 上的时间，大部分不是敲命令，而是看清分支之间的关系、审查改了什么、解决冲突时不丢掉任何一边的改动。',
        'Branchlight 就为这三件事而做，优先级只有一条：Git 正确性和好用的界面第一，轻量第二。',
      ],
      problem: [
        '在文本编辑器里对着冲突标记改，很容易一不小心只留了一边，另一边就丢了。',
        '丢弃改动、hard reset、强推，都离丢掉工作只差一次点击，而且没有回头路。',
        '拿任务分支和目标分支对比时，本地改动和只存在于目标分支的变化会混进来。',
        '自己重新实现 Git 的图形客户端，可能会和 Git 本身对仓库状态的理解悄悄不一致。',
      ],
      system: {
        intro:
          'Branchlight 把 Git 操作放在一个 Rust 引擎里，界面交给各平台自己负责。',
        layers: [
          {
            title: '原生 macOS 客户端',
            body: '变更、历史和合并编辑器都用 SwiftUI 和 AppKit 实现。编辑器选区、布局和撤销归 macOS 管，不拿内嵌的网页编辑器顶替。',
          },
          {
            title: 'C ABI 桥',
            body: '`branchlight-native` 持有仓库会话，每个请求只校验一次，返回和原来 Tauri 宿主一样的 JSON 模型。读操作共享访问，写操作独占。',
          },
          {
            title: 'Git 引擎',
            body: '`branchlight-core` 用显式参数数组调用官方 Git，不经过 shell 插值，所有客户端共用的审查规则也在这一层。',
          },
        ],
      },
      implementation: [
        {
          title: '三方合并就在代码旁边',
          body: '用 `git ls-files --unmerged` 和 `git cat-file` 读出索引的 1/2/3 三个阶段。结果只在未解决的区间里从 Base 起步；箭头接受一边，× 忽略一边，撤销时文本和决定一起恢复。',
        },
        {
          title: '保存不等于已解决',
          body: '保存前比对文件和未合并索引项的指纹，过期的写入直接拒绝。「标记为已解决」（`git add`）是单独的、显式的一步。',
        },
        {
          title: '按块、按行暂存',
          body: '基于 Git 自己的 diff 和 `git apply`，可以按块或按行暂存、取消暂存、丢弃。丢弃前先备份到 Git 目录里，之后还能恢复。',
        },
        {
          title: '看得懂的历史',
          body: '紧凑的提交表配泳道图，虚拟滚动、自动分页。筛选条件交给 `git log` 在整个仓库上跑，交互式 rebase 可以拖拽也可以用键盘。',
        },
        {
          title: '分发',
          body: '打一个版本 tag，GitHub Actions 就构建、签名、公证并发布 DMG；已装的版本通过 Sparkle 原地更新。',
        },
      ],
      decisions: [
        {
          title: '后端就用官方 Git',
          body: 'Branchlight 调用真正的 `git`，而不是自己重写一套，所以它对仓库的理解永远和命令行一致。',
        },
        {
          title: '危险操作必须明确同意',
          body: '强推只会以锁定在上次 fetch 值的 `--force-with-lease` 发出；hard reset 拒绝覆盖未跟踪文件；删除 worktree 从不强制。',
        },
        {
          title: '不保存任何凭据',
          body: '远程操作沿用已有的 Git 凭据助手和 SSH agent。Branchlight 没有登录流程，也不存密码。',
        },
        {
          title: 'Mac 上走原生',
          body: '从 0.8.0 起，macOS 版从 Tauri/React 客户端换成了同一引擎上的 SwiftUI 和 AppKit。Windows 保留 Tauri 客户端，目前暂停。',
        },
      ],
      result: {
        facts: [
          { label: '版本', value: 'v0.8.7' },
          { label: '平台', value: 'macOS · Apple 芯片' },
          { label: '引擎', value: 'Rust + 官方 Git' },
        ],
        notes: [
          '目前处在自用打磨阶段：我自己所有的 Git 工作（rebase、cherry-pick、大 diff、冲突、worktree）都在它里面做，遇到不顺手的地方记下来，小批量修。',
          'Windows 支持暂停中，Tauri 客户端仍跑在同一个引擎上。',
        ],
      },
    },
  },
};

export default branchlight;
