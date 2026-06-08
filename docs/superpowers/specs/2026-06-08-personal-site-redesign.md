# Personal Site Redesign

Date: 2026-06-08

## Context

The current site is a Next.js, Contentlayer, and MDX blog deployed through Vercel. It already has strong technical content around AI agents, developer tools, engineering efficiency, Java backend practice, Obsidian, and personal knowledge workflows.

The site should move from a generic technical blog template to a personal site that presents Cassian Florin as an AI-era software builder. Java and backend engineering remain important proof points, but they should no longer define the full boundary of the site.

## Positioning

Primary positioning:

> AI engineering tool builder, writing about developer tools, system design, and personal knowledge workflows.

Chinese homepage direction:

> AI 工程工具 Builder，记录开发者工具、系统设计与个人知识工作流的实践。

Supporting message:

> 我用 AI 扩展软件开发边界，把日常工程经验沉淀成工具、文章和可复用的工作流。

The site should communicate three things quickly:

- Builder: actively building tools and experiments.
- Writer: publishing practical engineering notes and long-form thinking.
- Systems thinker: connecting tools, workflows, and knowledge systems instead of only showing isolated posts.

## Target Information Architecture

Main navigation:

- Home
- Blog
- Projects
- Knowledge Map
- About

Tags should remain available for article discovery, but should not be a primary navigation item.

## Homepage Design

The homepage should stop being only a latest-post grid. It should become the main personal-site entry point.

### Hero

Purpose: explain who Cassian is and why the visitor should keep reading.

Content:

- Title: `AI 工程工具 Builder`
- Description: `我用 AI 扩展软件开发边界，把日常工程经验沉淀成工具、文章和可复用的工作流。`
- Primary actions: Projects, Blog, GitHub
- Direction labels:
  - AI Agent
  - Developer Tools
  - Knowledge Workflows
  - System Design

### Featured Projects

Purpose: prove the builder identity with real public work.

Homepage priority:

- `skill-hub`: package manager for AI agent skills.
- `database-cli`: read-only database CLI skill for Codex.

Each project should show:

- Problem it solves.
- What it provides.
- Tech stack or language.
- GitHub link.
- Related article links when available.

### Builder Ecosystem

Purpose: show related work without making every repository equal.

Content:

- `skill-hub-registry` should be presented as the official catalog registry for `skill-hub`, not as a separate main product.
- `MooTool` should be presented as open-source participation in developer tooling, not as a core self-owned project.

### Writing Topics

Purpose: make the blog feel curated rather than chronological.

Topic groups:

- AI Agent and developer tools.
- System design and engineering efficiency.
- Personal knowledge management and Obsidian workflows.

The homepage should link to selected representative posts instead of only the newest posts.

### Knowledge Map

Purpose: preserve and elevate the existing graph feature.

The current knowledge graph should be reframed as `我的知识地图`, a way to explore how posts, tags, and knowledge notes connect.

## Projects Page Design

The projects page should replace template data with real portfolio entries.

Recommended project groups:

- Main projects:
  - `skill-hub`
  - `database-cli`
- Ecosystem:
  - `skill-hub-registry`
- Open-source participation:
  - `MooTool`

Each project entry should include:

- What it is.
- Why it exists.
- What problem it solves.
- Current status.
- Tech stack.
- GitHub link.
- Optional related posts.

The page should avoid presenting placeholder images or generic template examples.

## About Page Design

The about page should move from a narrow Java developer identity to a broader builder identity.

Recommended identity:

> Software builder focused on AI-powered engineering workflows, developer tools, and knowledge systems.

Suggested sections:

- Who I am.
- Current focus.
- Engineering background.
- What I am building.
- Contact and public links.

Java, Spring, backend systems, and production engineering should remain in the engineering background section as credibility, not as the site's only identity.

## Existing Features

Keep:

- MDX blog.
- Contentlayer.
- Search.
- Dark mode.
- Knowledge graph.
- Vercel deployment.
- Giscus comments if environment variables are configured.

De-emphasize:

- Tags as main navigation.
- Homepage as a pure latest-post list.

Clean up:

- Template project data in `data/projectsData.ts`.
- Placeholder social links in `data/siteMetadata.js`.
- Generic homepage copy in `messages/zh.json` and `messages/en.json`.
- Narrow Java-only wording in `data/authors/default.mdx`.

## Implementation Scope

This redesign should be implemented as a focused information-architecture and content refresh. It should not replace the current stack, routing model, MDX pipeline, or Vercel deployment flow.

Suggested implementation order:

1. Update site metadata, navigation labels, and homepage content structure.
2. Replace project data with real pinned GitHub projects and portfolio copy.
3. Update About copy and Knowledge Map wording.
4. Run formatting and build verification.
5. Commit and push so Vercel can deploy.

## Verification

Before shipping:

- Run formatting checks on touched files.
- Run the existing Contentlayer/Next build.
- Verify homepage, projects page, knowledge page, and about page locally.
- Confirm no template projects or placeholder social links remain visible.
