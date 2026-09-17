/**
 * A project case study: Why → Problem → System → Implementation → Decisions →
 * Result. Inline `code` spans in any string are rendered as <code>.
 *
 * Keep every claim traceable to the project's README, release notes or product
 * page — these pages are the engineering archive, not marketing copy.
 */
export interface CaseStudyItem {
  title: string;
  body: string;
}

export interface CaseStudyFact {
  label: string;
  value: string;
}

export interface CaseStudy {
  /** One sentence: what it is, in editorial voice. */
  summary: string;
  why: string[];
  problem: string[];
  system: {
    intro: string;
    /** Rendered top-to-bottom as a stacked diagram. */
    layers: CaseStudyItem[];
  };
  implementation: CaseStudyItem[];
  decisions: CaseStudyItem[];
  result: {
    facts: CaseStudyFact[];
    notes: string[];
  };
}

export interface CaseStudyLink {
  kind: 'source' | 'site' | 'download';
  href: string;
  label: { zh: string; en: string };
}

export interface CaseStudyEntry {
  /** Matches `Project.id` in data/projectsData.ts. */
  projectId: string;
  /** Year the project started, when known. */
  started?: string;
  links: CaseStudyLink[];
  /** Posts that are explicitly about this project (blog slugs). */
  relatedPostSlugs?: string[];
  content: { zh: CaseStudy; en: CaseStudy };
}
