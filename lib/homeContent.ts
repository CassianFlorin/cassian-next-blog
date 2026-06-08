export const heroActions = [
  { href: '/projects', labelKey: 'projectsAction' },
  { href: '/blog', labelKey: 'blogAction' },
  {
    href: 'https://github.com/CassianFlorin',
    labelKey: 'githubAction',
  },
] as const;

export const focusAreaKeys = [
  'aiAgent',
  'developerTools',
  'knowledgeWorkflows',
  'systemDesign',
] as const;

export const writingTopics = [
  {
    id: 'aiTools',
    href: '/tags/AI',
  },
  {
    id: 'engineeringEfficiency',
    href: '/tags/工程方法论',
  },
  {
    id: 'knowledgeManagement',
    href: '/tags/Obsidian',
  },
] as const;

export const selectedPostSlugs = [
  '20260526-codegraph-agent-coding',
  '20260515-agent-obsidian-knowledge-workflow',
  '20260509-openclaw-vs-hermes-agent',
];
