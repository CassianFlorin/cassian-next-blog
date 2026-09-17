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
    id: 'skillHub',
    title: 'skill-hub',
    href: 'https://github.com/CassianFlorin/skill-hub',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub',
    category: 'featured',
    techStack: ['Go', 'CLI', 'AI Agent', 'Developer Tools'],
    knowledgeNodes: ['ai-agent', 'tools'],
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
    id: 'skillHubRegistry',
    title: 'skill-hub-registry',
    href: 'https://github.com/CassianFlorin/skill-hub-registry',
    sourceHref: 'https://github.com/CassianFlorin/skill-hub-registry',
    category: 'ecosystem',
    techStack: ['Python', 'Registry', 'Catalog', 'Automation'],
    knowledgeNodes: ['ai-agent', 'tools'],
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
