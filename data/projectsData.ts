export interface Project {
  /** Key into messages `projects.items.<id>` for localized copy */
  id: string;
  title: string;
  imgSrc?: string;
  href?: string;
  sourceHref?: string;
  category: 'app' | 'featured' | 'ecosystem' | 'open-source';
  techStack: string[];
  relatedPosts?: Array<{
    title: string;
    href: string;
  }>;
}

const projectsData: Project[] = [
  {
    id: 'litho',
    title: 'Litho',
    href: '/litho',
    category: 'app',
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
    id: 'skillHub',
    title: 'skill-hub',
    href: 'https://github.com/CassianFlorin/skill-hub',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub',
    category: 'featured',
    techStack: ['Go', 'CLI', 'AI Agent', 'Developer Tools'],
    relatedPosts: [
      {
        title: 'Agent 光会 grep 还不够：CodeGraph 让它先看懂代码结构',
        href: '/blog/20260526-codegraph-agent-coding',
      },
    ],
  },
  {
    id: 'databaseCli',
    title: 'database-cli',
    href: 'https://github.com/CassianFlorin/database-cli',
    sourceHref: 'https://github.com/CassianFlorin/database-cli',
    category: 'featured',
    techStack: ['Python', 'CLI', 'Codex Skill', 'Database'],
  },
  {
    id: 'skillHubRegistry',
    title: 'skill-hub-registry',
    href: 'https://github.com/CassianFlorin/skill-hub-registry',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub-registry',
    category: 'ecosystem',
    techStack: ['Python', 'Registry', 'Catalog', 'Automation'],
  },
  {
    id: 'mooTool',
    title: 'MooTool',
    href: 'https://github.com/CassianFlorin/MooTool',
    sourceHref: 'https://github.com/CassianFlorin/MooTool',
    category: 'open-source',
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
