import type { CaseStudyEntry } from './types';

const waitlight: CaseStudyEntry = {
  projectId: 'waitlight',
  started: '2026',
  links: [
    {
      kind: 'site',
      href: 'https://waitlight.cassianflorin.com/',
      label: { zh: '产品主页', en: 'Product site' },
    },
    {
      kind: 'download',
      href: 'https://github.com/CassianFlorin/Waitlight/releases/latest',
      label: { zh: '下载最新版', en: 'Latest release' },
    },
    {
      kind: 'source',
      href: 'https://github.com/CassianFlorin/Waitlight',
      label: { zh: 'GitHub 源码', en: 'Source on GitHub' },
    },
  ],
  content: {
    en: {
      summary:
        'A native macOS workspace for running several coding agents side by side, locally or over SSH, with one sidebar that shows which one needs you.',
      why: [
        'Coding with agents usually means running several at once: Claude Code in one repository, Codex in another, a third on a server.',
        'That turns into a pile of terminal tabs, and most of the day goes to checking which agent is still working, which one is stuck on a permission prompt, and where a conversation went after the window closed.',
      ],
      problem: [
        'A terminal tab cannot tell you whether the agent inside it is working, waiting for you, or done with its turn.',
        'Local sessions and sessions on servers live in different windows, and a dropped SSH connection takes the running agent with it.',
        'Relaunch the terminal and every agent starts a fresh conversation instead of the one it was in.',
        'Two agents working in the same checkout end up editing the same files.',
      ],
      system: {
        intro:
          'Waitlight keeps the terminal a terminal and adds a layer that knows what each agent is doing.',
        layers: [
          {
            title: 'Workspace',
            body: 'A sessions sidebar grouped by machine, the Agent overview (`⇧⌘A`) and a task bar that starts a new agent with a prompt, each in its own session.',
          },
          {
            title: 'Agent state',
            body: 'Every pane tracks its own agent: working, waiting for you, done with its turn, or exited. `⌘⇧J` jumps to the next one that is waiting.',
          },
          {
            title: 'Terminal',
            body: 'Every pane is Ghostty, embedded through libghostty, so your Ghostty config, themes and keybinds carry over.',
          },
          {
            title: 'Machines',
            body: 'This Mac, plus every host in `~/.ssh/config` over plain SSH, with tmux or zellij used when the server already has one.',
          },
        ],
      },
      implementation: [
        {
          title: 'Status from hooks, then signals',
          body: "Claude Code reports its state through hooks passed with `--settings` at launch. Codex and Grok can opt in with one file of Waitlight's own. Everything else is read from terminal signals: Return, the bell, OSC 9/777 notifications, OSC 9;4 progress and the agent exiting.",
        },
        {
          title: 'Conversations that come back',
          body: 'Each pane remembers its conversation id, so relaunching Waitlight or restarting an exited agent resumes the same conversation in the same pane. Sessions, splits, groups and SSH connections are restored with it.',
        },
        {
          title: 'A worktree per task',
          body: 'A task handed out from the overview gets its own git worktree on a new branch in `<repo>.worktrees/`, with the gitignored files it needs copied in from `.worktreeinclude`. The same works on a server, over one SSH connection.',
        },
        {
          title: 'Remote without an agent on the server',
          body: 'SSH sessions use tmux or zellij when present, so a dropped connection reattaches with the agent still running. The performance panel samples a server through one SSH loop over `/proc`.',
        },
        {
          title: 'Distribution',
          body: 'A Developer ID–signed, notarized DMG and a Homebrew cask. Updates come from GitHub Releases through Sparkle, EdDSA-signed, and ask before restarting while an agent is mid-turn.',
        },
      ],
      decisions: [
        {
          title: 'Never edit the agent’s own settings',
          body: "Claude Code's hooks are passed at launch, not written to its config. The Codex and Grok hooks are opt-in, live in a file of Waitlight's own, and are deleted when switched off.",
        },
        {
          title: 'Nothing to install on the server',
          body: 'Only ssh, git, and tmux if the server has it. A tool for many servers should not need a daemon on each of them.',
        },
        {
          title: 'Keep the terminal a real terminal',
          body: 'Ghostty does the terminal work. Waitlight adds state, overview and restore on top instead of building another emulator.',
        },
        {
          title: 'No telemetry',
          body: 'The only connection Waitlight makes on its own is checking GitHub Releases for updates.',
        },
      ],
      result: {
        facts: [
          { label: 'Release line', value: 'v0.12' },
          { label: 'Platform', value: 'macOS 14+ · Apple silicon' },
          { label: 'Install', value: 'Homebrew · DMG' },
        ],
        notes: [
          'Open source under MIT. Built-in presets for twelve agent CLIs, from Claude Code, Codex and Gemini to Aider and Amp, plus any other CLI you add. It was called AgentDeck before 0.10; installed copies updated in place.',
          'Not yet: agents started on a server do not report their working / waiting state back to the Mac, so they show in the sidebar but not in the Agent overview.',
        ],
      },
    },
    zh: {
      summary:
        '一个原生 macOS 工作台：在本机或经 SSH 同时跑多个编程 Agent，一条侧边栏告诉你哪个在等你。',
      why: [
        '用 AI Agent 写代码，通常意味着同时开好几个：一个仓库里跑 Claude Code，另一个跑 Codex，服务器上再挂一个。',
        '结果就是一堆终端标签页，一天里大把时间花在来回查看：哪个还在跑、哪个卡在权限确认上、窗口关掉之后那段对话去哪了。',
      ],
      problem: [
        '终端标签页说不出里面的 Agent 是在干活、在等你，还是这一轮已经做完。',
        '本机会话和服务器会话分在不同的窗口里，SSH 一断，正在跑的 Agent 也跟着没了。',
        '重开终端，每个 Agent 都开了新对话，而不是回到原来那段。',
        '两个 Agent 在同一个检出目录里干活，会改到同一批文件。',
      ],
      system: {
        intro:
          'Waitlight 让终端还是终端，只在上面加一层：知道每个 Agent 正在干什么。',
        layers: [
          {
            title: '工作区',
            body: '按机器分组的会话侧边栏、Agent 总览（`⇧⌘A`），以及一个派任务的输入栏：写一句任务，就在新会话里启动一个 Agent。',
          },
          {
            title: 'Agent 状态',
            body: '每个窗格单独跟踪自己的 Agent：运行中、等你、本轮完成、已退出。`⌘⇧J` 直接跳到下一个在等你的。',
          },
          {
            title: '终端',
            body: '每个窗格都是通过 libghostty 嵌入的 Ghostty，你的 Ghostty 配置、主题和快捷键原样生效。',
          },
          {
            title: '机器',
            body: '本机，加上 `~/.ssh/config` 里的每一台主机，走普通 SSH；服务器上本来就有 tmux 或 zellij 时会用上它。',
          },
        ],
      },
      implementation: [
        {
          title: '状态先看 hooks，再看信号',
          body: 'Claude Code 通过启动时用 `--settings` 传入的 hooks 汇报状态；Codex 和 Grok 可以选择开启，只写一个 Waitlight 自己的文件。其余 Agent 从终端信号判断：回车、响铃、OSC 9/777 通知、OSC 9;4 进度和 Agent 退出。',
        },
        {
          title: '对话能接回来',
          body: '每个窗格记住自己的对话 id，重启 Waitlight 或重启已退出的 Agent，都会在同一个窗格里接回同一段对话。会话、分屏、分组和 SSH 连接一起恢复。',
        },
        {
          title: '一个任务一个 worktree',
          body: '从总览派出的任务会在 `<repo>.worktrees/` 里拿到自己的 git worktree 和新分支，需要的被忽略文件按 `.worktreeinclude` 从主检出复制过去。服务器上也一样，只用一条 SSH。',
        },
        {
          title: '远程不往服务器装东西',
          body: 'SSH 会话有 tmux 或 zellij 就用，断线重连时 Agent 还在跑。性能面板通过一条 SSH 里的小循环读 `/proc` 来采样服务器。',
        },
        {
          title: '分发',
          body: 'Developer ID 签名并经过公证的 DMG，外加 Homebrew cask。更新走 GitHub Releases + Sparkle，EdDSA 签名；有 Agent 正在跑时，重启前会先问你。',
        },
      ],
      decisions: [
        {
          title: '绝不改 Agent 自己的配置',
          body: 'Claude Code 的 hooks 在启动时传入，不写进它的配置文件。Codex 和 Grok 的 hooks 是可选的，放在 Waitlight 自己的文件里，关掉就删除。',
        },
        {
          title: '服务器上什么都不用装',
          body: '只用 ssh、git，以及服务器上已有的 tmux。一个管很多台服务器的工具，不该要求每台都跑一个守护进程。',
        },
        {
          title: '终端就用真正的终端',
          body: '终端的活交给 Ghostty。Waitlight 只在上面加状态、总览和恢复，不再造一个终端模拟器。',
        },
        {
          title: '没有遥测',
          body: 'Waitlight 唯一主动发起的连接，是去 GitHub Releases 检查更新。',
        },
      ],
      result: {
        facts: [
          { label: '版本线', value: 'v0.12' },
          { label: '平台', value: 'macOS 14+ · Apple 芯片' },
          { label: '安装方式', value: 'Homebrew · DMG' },
        ],
        notes: [
          'MIT 协议开源。内置十二个 Agent CLI 的预设，从 Claude Code、Codex、Gemini 到 Aider、Amp，其他任意 CLI 也能自己加。0.10 之前叫 AgentDeck，已装的版本原地升级。',
          '还没做到：在服务器上启动的 Agent 无法把运行中 / 等你的状态传回 Mac，所以它们出现在侧边栏里，但还不在 Agent 总览中。',
        ],
      },
    },
  },
};

export default waitlight;
