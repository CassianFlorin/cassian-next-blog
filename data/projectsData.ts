export interface Project {
  title: string;
  description: string;
  imgSrc?: string;
  problem: string;
  solution: string;
  href?: string;
  sourceHref?: string;
  category: 'app' | 'featured' | 'ecosystem' | 'open-source';
  status: string;
  techStack: string[];
  relatedPosts?: Array<{
    title: string;
    href: string;
  }>;
}

const projectsData: Project[] = [
  {
    title: 'Litho',
    description:
      'A native iOS client for linux.do — a SwiftUI app that renders the Discourse community natively while punching through Cloudflare and keeping you logged in. 原生 iOS 的 linux.do 第三方客户端。',
    problem:
      'linux.do runs on Discourse behind Cloudflare, so third-party tools and even simple scripts constantly hit challenge pages and lose their session. There is no smooth, native way to browse and interact from an iPhone.',
    solution:
      'Litho routes every request through an off-screen WKWebView gateway that borrows the browser UA / Cookie / TLS fingerprint, so it sails past Cloudflare and holds the login state. On that foundation it delivers a full SwiftUI experience: topic feeds, single-document post rendering, reactions, chat, private messages and real-time notifications via MessageBus.',
    href: '/litho',
    category: 'app',
    status: 'Daily driver · iOS 即将上架',
    techStack: [
      'Swift',
      'SwiftUI',
      'iOS 17+',
      'WKWebView',
      'Discourse API',
      'GRDB',
    ],
  },
  {
    title: 'skill-hub',
    description:
      'The package manager for AI agent skills. Install, update, sync, and govern skills across coding agents.',
    problem:
      'AI coding agents are becoming part of daily development, but their reusable skills are still scattered across repos, local folders, and different agent ecosystems.',
    solution:
      'skill-hub turns skills into manageable packages so they can be installed, updated, synchronized, and governed across Codex, Claude, Gemini, and similar workflows.',
    href: 'https://github.com/CassianFlorin/skill-hub',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub',
    category: 'featured',
    status: 'Active',
    techStack: ['Go', 'CLI', 'AI Agent', 'Developer Tools'],
    relatedPosts: [
      {
        title: 'Agent 光会 grep 还不够：CodeGraph 让它先看懂代码结构',
        href: '/blog/20260526-codegraph-agent-coding',
      },
    ],
  },
  {
    title: 'database-cli',
    description: 'Read-only database CLI skill for Codex.',
    problem:
      'Real production debugging often needs schema lookup, safe read-only SQL, and cross-environment comparison without turning an AI session into an unsafe database client.',
    solution:
      'database-cli gives Codex a controlled database investigation workflow: inspect schema, search metadata, run read-only queries, and compare records with guardrails.',
    href: 'https://github.com/CassianFlorin/database-cli',
    sourceHref: 'https://github.com/CassianFlorin/database-cli',
    category: 'featured',
    status: 'Active',
    techStack: ['Python', 'CLI', 'Codex Skill', 'Database'],
  },
  {
    title: 'skill-hub-registry',
    description: 'Official catalog registry for skill-hub.',
    problem:
      'A package manager needs a trusted source of skill metadata so users can discover installable skills without copying raw repository paths by hand.',
    solution:
      'skill-hub-registry provides the catalog layer for skill-hub, separating registry metadata from the CLI runtime.',
    href: 'https://github.com/CassianFlorin/skill-hub-registry',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub-registry',
    category: 'ecosystem',
    status: 'Active',
    techStack: ['Python', 'Registry', 'Catalog', 'Automation'],
  },
  {
    title: 'MooTool',
    description: 'Handy tool set for developers. 开发者常备小工具。',
    problem:
      'Developers repeatedly need small local utilities for text, encoding, diffing, and daily engineering tasks.',
    solution:
      'MooTool collects practical developer utilities in a Java desktop tool. This site presents it as open-source participation in developer tooling.',
    href: 'https://github.com/CassianFlorin/MooTool',
    sourceHref: 'https://github.com/CassianFlorin/MooTool',
    category: 'open-source',
    status: 'Open-source participation',
    techStack: ['Java', 'Developer Tools', 'Desktop Utility'],
    relatedPosts: [
      {
        title: '今天成为了 MooTool 贡献者',
        href: '/blog/20250927-MooToolContributors',
      },
    ],
  },
];

export default projectsData;
