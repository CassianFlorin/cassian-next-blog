# Personal Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing blog-first site into a personal Builder site centered on AI engineering tools, developer workflows, knowledge systems, and public projects.

**Architecture:** Keep the current Next.js, Contentlayer, MDX, i18n, and Vercel deployment flow. Move reusable homepage and portfolio copy into typed data files, then update page components to render the new information architecture without changing routing or the content pipeline.

**Tech Stack:** Next.js 15, React 19, TypeScript, Contentlayer2, next-intl, Tailwind CSS, Vercel.

---

## File Structure

- Create `data/homeContent.ts`: single source for homepage hero copy, focus areas, writing topics, and selected article slugs.
- Modify `data/projectsData.ts`: replace template projects with real portfolio entries for `skill-hub`, `database-cli`, `skill-hub-registry`, and `MooTool`.
- Modify `app/Main.tsx`: replace latest-post-first homepage with Builder hero, featured projects, writing topics, knowledge map entry, and selected articles.
- Modify `app/[locale]/projects/page.tsx`: render grouped portfolio entries instead of generic cards.
- Modify `data/headerNavLinks.ts`: remove `Tags` from primary navigation and keep Knowledge as a primary route.
- Modify `messages/zh.json` and `messages/en.json`: update homepage, project, and knowledge-map wording.
- Modify `data/siteMetadata.js`: update site title, description, header title, repo URL casing, GitHub/X links, and remove visible placeholder social links.
- Modify `data/authors/default.mdx`: update author identity from Java-only to AI engineering workflows, developer tools, knowledge systems, and engineering background.
- Modify `app/[locale]/knowledge/page.tsx`: update metadata from Knowledge Graph to Knowledge Map.

## Task 1: Add Homepage Content Data

**Files:**

- Create: `data/homeContent.ts`

- [ ] **Step 1: Create homepage content data**

Create `data/homeContent.ts` with this content:

```ts
export const heroContent = {
  title: 'AI 工程工具 Builder',
  description:
    '我用 AI 扩展软件开发边界，把日常工程经验沉淀成工具、文章和可复用的工作流。',
  actions: [
    { href: '/projects', label: '查看项目' },
    { href: '/blog', label: '阅读文章' },
    { href: 'https://github.com/CassianFlorin', label: 'GitHub' },
  ],
  focusAreas: [
    'AI Agent',
    'Developer Tools',
    'Knowledge Workflows',
    'System Design',
  ],
};

export const writingTopics = [
  {
    title: 'AI Agent 与开发者工具',
    description: '记录 CodeGraph、skill-hub、Agent 框架和 AI 辅助开发的实践。',
    href: '/tags/AI',
  },
  {
    title: '系统设计与工程效率',
    description: '沉淀后端系统、开发环境、部署入口和工程工具链经验。',
    href: '/tags/工程方法论',
  },
  {
    title: '个人知识管理与 Obsidian',
    description: '探索 Agent、Obsidian 和知识图谱如何组成长期知识工作流。',
    href: '/tags/Obsidian',
  },
];

export const selectedPostSlugs = [
  '20260526-codegraph-agent-coding',
  '20260515-agent-obsidian-knowledge-workflow',
  '20260509-openclaw-vs-hermes-agent',
];
```

- [ ] **Step 2: Run TypeScript syntax check through build pipeline later**

No standalone TypeScript command is needed here. This file is validated in Task 5 with `yarn build`.

## Task 2: Replace Project Data With Real Portfolio Entries

**Files:**

- Modify: `data/projectsData.ts`

- [ ] **Step 1: Replace the project interface and data**

Replace the full contents of `data/projectsData.ts` with:

```ts
export interface Project {
  title: string;
  description: string;
  problem: string;
  solution: string;
  href: string;
  sourceHref: string;
  category: 'featured' | 'ecosystem' | 'open-source';
  status: string;
  techStack: string[];
  relatedPosts?: Array<{
    title: string;
    href: string;
  }>;
}

const projectsData: Project[] = [
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
```

- [ ] **Step 2: Verify no template project names remain**

Run:

```bash
rg -n "A Search Engine|The Time Machine|google.png|time-machine" data app components
```

Expected: no matches.

## Task 3: Rebuild Homepage as Personal Site Entry

**Files:**

- Modify: `app/Main.tsx`
- Depends on: `data/homeContent.ts`, `data/projectsData.ts`

- [ ] **Step 1: Replace imports in `app/Main.tsx`**

Use these imports:

```ts
'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from '@/components/Link';
import Tag from '@/components/Tag';
import siteMetadata from '@/data/siteMetadata';
import projectsData from '@/data/projectsData';
import {
  heroContent,
  selectedPostSlugs,
  writingTopics,
} from '@/data/homeContent';
import { formatDate } from 'pliny/utils/formatDate';
import { useTranslations } from 'next-intl';
import { staggerFadeInUp } from '@/lib/animations/stagger';
import { useAnime } from '@/lib/hooks/useAnime';
import { fadeInUp } from '@/lib/animations/fadeIn';
```

- [ ] **Step 2: Replace the homepage render structure**

Inside `Home`, compute featured projects and selected posts:

```ts
const featuredProjects = projectsData.filter(
  (project) => project.category === 'featured',
);
const selectedPosts = useMemo(() => {
  const bySlug = new Map(posts.map((post) => [post.slug, post]));
  return selectedPostSlugs
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, 3);
}, [posts]);
```

Render these sections in order:

- Hero using `heroContent`.
- Featured Projects using `featuredProjects`.
- Writing Topics using `writingTopics`.
- Knowledge Map entry linking to `/knowledge`.
- Selected Articles using `selectedPosts`, falling back to newest three posts if no selected slugs are found.

Use the existing card styling language: restrained cards, `rounded-2xl`, `bg-white/60`, `dark:bg-gray-900/40`, and existing animations.

- [ ] **Step 3: Preserve post card behavior**

Keep `formatDate(date, siteMetadata.locale)`, article links at `/blog/${slug}`, and tag rendering through `<Tag key={tag} text={tag} />`.

- [ ] **Step 4: Run formatter on changed homepage files**

Run:

```bash
yarn prettier --write app/Main.tsx data/homeContent.ts data/projectsData.ts
```

Expected: command exits 0.

## Task 4: Rebuild Projects Page and Site Copy

**Files:**

- Modify: `app/[locale]/projects/page.tsx`
- Modify: `data/headerNavLinks.ts`
- Modify: `messages/zh.json`
- Modify: `messages/en.json`
- Modify: `app/[locale]/knowledge/page.tsx`
- Modify: `data/siteMetadata.js`
- Modify: `data/authors/default.mdx`

- [ ] **Step 1: Replace projects page grouping**

In `app/[locale]/projects/page.tsx`, remove the `Card` import and group projects by category:

```ts
const featuredProjects = projectsData.filter((p) => p.category === 'featured');
const ecosystemProjects = projectsData.filter(
  (p) => p.category === 'ecosystem',
);
const openSourceProjects = projectsData.filter(
  (p) => p.category === 'open-source',
);
```

Render sections named:

- `Featured Projects`
- `Builder Ecosystem`
- `Open Source Participation`

Each project card should display title, description, problem, solution, status, tech stack, GitHub link, and related posts when present.

- [ ] **Step 2: Remove Tags from main navigation**

Set `data/headerNavLinks.ts` to:

```ts
const headerNavLinks = [
  { href: '/', title: 'common.home' },
  { href: '/blog', title: 'common.blog' },
  { href: '/knowledge', title: 'common.knowledge' },
  { href: '/projects', title: 'common.projects' },
  { href: '/about', title: 'common.about' },
];

export default headerNavLinks;
```

- [ ] **Step 3: Update translation copy**

In `messages/zh.json`:

```json
"home": {
  "title": "AI 工程工具 Builder",
  "description": "我用 AI 扩展软件开发边界，把日常工程经验沉淀成工具、文章和可复用的工作流。",
  "readMore": "阅读更多",
  "viewAllPosts": "查看所有文章"
}
```

Set `common.knowledge` and `knowledge.title` to `知识地图`.

In `messages/en.json`:

```json
"home": {
  "title": "AI Engineering Tool Builder",
  "description": "I use AI to expand the boundaries of software development, turning engineering experience into tools, writing, and reusable workflows.",
  "readMore": "Read More",
  "viewAllPosts": "View All Posts"
}
```

Set `common.knowledge` and `knowledge.title` to `Knowledge Map`.

- [ ] **Step 4: Update knowledge page metadata**

In `app/[locale]/knowledge/page.tsx`, set:

```ts
export const metadata = genPageMetadata({
  title: 'Knowledge Map',
  description:
    'Explore how posts, tags, and knowledge notes connect across the site.',
});
```

- [ ] **Step 5: Update site metadata**

In `data/siteMetadata.js`, update:

```js
title: 'Cassian Florin · AI Engineering Tool Builder',
headerTitle: 'Cassian Florin',
description:
  'Cassian Florin writes about AI engineering tools, developer workflows, system design, and personal knowledge systems.',
siteRepo: 'https://github.com/CassianFlorin/cassianflorin.com',
github: 'https://github.com/CassianFlorin',
x: 'https://x.com/ynyng90660098',
linkedin: '',
facebook: '',
youtube: '',
threads: '',
instagram: '',
medium: '',
bluesky: '',
```

- [ ] **Step 6: Update author page content**

In `data/authors/default.mdx`, update frontmatter:

```md
occupation: Software Builder focused on AI-powered engineering workflows
github: https://github.com/CassianFlorin
twitter: https://x.com/ynyng90660098
linkedin:
```

Replace the body with sections for:

- Builder identity.
- Current focus: AI engineering tools, developer workflows, knowledge systems.
- Engineering background: Java, Spring Boot, backend systems, production debugging.
- Current projects: skill-hub, database-cli, skill-hub-registry.
- Contact.

- [ ] **Step 7: Format copy files**

Run:

```bash
yarn prettier --write 'app/[locale]/projects/page.tsx' 'app/[locale]/knowledge/page.tsx' data/headerNavLinks.ts data/siteMetadata.js data/authors/default.mdx messages/zh.json messages/en.json
```

Expected: command exits 0.

## Task 5: Verify, Review, and Commit

**Files:**

- Review all changed files.
- No new runtime dependencies expected.

- [ ] **Step 1: Run literal cleanup checks**

Run:

```bash
rg -n "A Search Engine|The Time Machine|https://youtube.com|https://www.linkedin.com$|分享技术、生活和想法|Java Backend Developer \\| Tech Blogger" data app messages
```

Expected: no matches.

- [ ] **Step 2: Run content metadata generation**

Run:

```bash
yarn contentlayer2 build
```

Expected: command exits 0 and regenerates Contentlayer output if needed.

- [ ] **Step 3: Run full build**

Run:

```bash
yarn build
```

Expected: command exits 0.

- [ ] **Step 4: Start local dev server**

Run:

```bash
yarn dev
```

Expected: Next dev server starts on an available localhost port.

- [ ] **Step 5: Browser verification**

Open the local site and verify:

- Homepage presents Builder positioning first.
- Featured projects show `skill-hub` and `database-cli`.
- Projects page groups featured, ecosystem, and open-source participation.
- Knowledge route uses Knowledge Map wording.
- About page no longer presents Java as the only identity.
- Header no longer shows Tags in primary navigation.

- [ ] **Step 6: Stop local dev server**

Stop the dev server cleanly after browser verification.

- [ ] **Step 7: Review diff**

Run:

```bash
git diff --stat
git diff -- data/homeContent.ts data/projectsData.ts app/Main.tsx 'app/[locale]/projects/page.tsx' data/siteMetadata.js data/authors/default.mdx
```

Expected: diff matches the approved redesign and contains no unrelated refactors.

- [ ] **Step 8: Commit implementation**

Run:

```bash
git add app data messages
git commit -m "feat: redesign site as personal builder homepage"
```

Expected: commit succeeds after lint-staged formatting.
