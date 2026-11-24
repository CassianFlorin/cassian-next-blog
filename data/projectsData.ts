import type { KnowledgeCategoryKey } from '@/lib/knowledgeGraphMapModel';

export interface Project {
  /** Key into messages `projects.items.<id>` for localized copy */
  id: string;
  title: string;
  imgSrc?: string;
  href?: string;
  sourceHref?: string;
  category: 'app' | 'featured' | 'ecosystem' | 'open-source';
  techStack: string[];
  /** Knowledge territories this project belongs to (see lib/knowledgeNodes). */
  knowledgeNodes?: KnowledgeCategoryKey[];
}

const projectsData: Project[] = [
  {
    id: 'waitlight',
    title: 'Waitlight',
    href: 'https://waitlight.cassianflorin.com/',
    sourceHref: 'https://github.com/CassianFlorin/Waitlight',
    category: 'featured',
    techStack: ['Swift', 'AppKit', 'libghostty', 'SSH', 'AI Agent'],
    knowledgeNodes: ['ai-agent', 'tools'],
  },
  {
    id: 'branchlight',
    title: 'Branchlight',
    href: 'https://github.com/CassianFlorin/branchlight-app/releases/latest',
    category: 'app',
    techStack: ['Rust', 'SwiftUI', 'AppKit', 'Git', 'Tauri'],
    knowledgeNodes: ['tools', 'languages'],
  },
  {
    id: 'litho',
    title: 'Litho',
    href: '/litho',
    category: 'app',
    techStack: [
      'Swift',
      'SwiftUI',
      'iOS 17+',
      'Kotlin',
      'Compose',
      'WKWebView',
      'Discourse API',
      'GRDB',
    ],
    knowledgeNodes: ['projects', 'languages'],
  },
  {
    id: 'databaseCli',
    title: 'database-cli',
    href: 'https://github.com/CassianFlorin/database-cli',
    sourceHref: 'https://github.com/CassianFlorin/database-cli',
    category: 'featured',
    techStack: ['Python', 'CLI', 'Codex Skill', 'Database'],
    knowledgeNodes: ['ai-agent', 'tools', 'data-integration'],
  },
  {
    id: 'mooTool',
    title: 'MooTool',
    href: 'https://github.com/CassianFlorin/MooTool',
    sourceHref: 'https://github.com/CassianFlorin/MooTool',
    category: 'open-source',
    techStack: ['Java', 'Developer Tools', 'Desktop Utility'],
    knowledgeNodes: ['tools', 'projects'],
  },
];

export default projectsData;
