import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { slug as slugify } from 'github-slugger';

const MARKDOWN_EXT = '.md';
const DEFAULT_EXCLUDED_DIRS = new Set([
  '.git',
  '.obsidian',
  '.trash',
  'node_modules',
  'Templates',
  'templates',
]);

const WIKILINK_RE = /!?\[\[([^\]\n]+)\]\]/g;
const INLINE_TAG_RE = /(^|[\s(])#([\p{L}\p{N}_/-]+)/gu;

const normalizePath = (value) => value.split(path.sep).join('/');

const stripMarkdownExt = (value) =>
  value.endsWith(MARKDOWN_EXT) ? value.slice(0, -MARKDOWN_EXT.length) : value;

const slugPath = (value) =>
  value
    .split('/')
    .map((segment) => slugify(segment).toLowerCase())
    .join('/');

const graphNodeId = (relativePath) =>
  `obsidian:${slugPath(stripMarkdownExt(relativePath))}`;

const graphTagId = (tag) => `tag:${slugify(tag)}`;

const normalizeTag = (tag) =>
  String(tag || '')
    .replace(/^#/, '')
    .trim();

const nodeAnchor = (id) => `#${id.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

const isTruthy = (value) => value === true || value === 'true' || value === 1;

const shouldSkipDir = (dirName, excludedDirs) => excludedDirs.has(dirName);

const walkMarkdownFiles = (root, excludedDirs = DEFAULT_EXCLUDED_DIRS) => {
  if (!fs.existsSync(root)) return [];

  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!shouldSkipDir(entry.name, excludedDirs)) {
          visit(path.join(dir, entry.name));
        }
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(MARKDOWN_EXT)) {
        files.push(path.join(dir, entry.name));
      }
    }
  };

  visit(root);
  return files;
};

const isPublicNote = (data) =>
  isTruthy(data.publish) || isTruthy(data.graph) || isTruthy(data.public);

const readNote = (vaultRoot, filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const relativePath = normalizePath(path.relative(vaultRoot, filePath));
  const basename = stripMarkdownExt(path.basename(relativePath));
  const slug = slugPath(stripMarkdownExt(relativePath));

  return {
    aliases: Array.isArray(parsed.data.aliases) ? parsed.data.aliases : [],
    content: parsed.content,
    data: parsed.data,
    filePath,
    label: String(parsed.data.title || basename),
    relativePath,
    slug,
  };
};

const collectFrontmatterTags = (data) => {
  const rawTags = Array.isArray(data.tags) ? data.tags : [];
  return rawTags.map(normalizeTag).filter(Boolean);
};

const collectInlineTags = (content) => {
  const tags = [];
  for (const match of content.matchAll(INLINE_TAG_RE)) {
    tags.push(normalizeTag(match[2]));
  }
  return tags;
};

const normalizeWikiTarget = (value) => {
  const withoutAlias = value.split('|')[0];
  const withoutHeading = withoutAlias.split('#')[0];
  return stripMarkdownExt(withoutHeading.trim());
};

const collectWikiTargets = (content) => {
  const targets = [];
  for (const match of content.matchAll(WIKILINK_RE)) {
    const target = normalizeWikiTarget(match[1]);
    if (target) targets.push(target);
  }
  return targets;
};

const buildLookup = (notes) => {
  const lookup = new Map();

  for (const note of notes) {
    const relativeNoExt = stripMarkdownExt(note.relativePath);
    const basename = stripMarkdownExt(path.basename(note.relativePath));

    [
      relativeNoExt,
      basename,
      note.label,
      ...note.aliases.filter((alias) => typeof alias === 'string'),
    ].forEach((key) => {
      const normalized = slugPath(key);
      if (normalized && !lookup.has(normalized)) {
        lookup.set(normalized, note);
      }
    });
  }

  return lookup;
};

const pushUniqueLink = (links, seen, source, target, type) => {
  const key = `${source}->${target}:${type}`;
  if (seen.has(key)) return;
  seen.add(key);
  links.push({ source, target, type });
};

export function buildObsidianGraph({ vaultRoot }) {
  if (!vaultRoot) return { nodes: [], links: [] };

  const notes = walkMarkdownFiles(vaultRoot)
    .map((filePath) => readNote(vaultRoot, filePath))
    .filter((note) => isPublicNote(note.data));

  const lookup = buildLookup(notes);
  const nodes = new Map();
  const links = [];
  const seenLinks = new Set();

  for (const note of notes) {
    const noteId = graphNodeId(note.relativePath);
    nodes.set(noteId, {
      id: noteId,
      type: 'post',
      label: note.label,
      href: nodeAnchor(noteId),
      slug: note.slug,
      summary: note.data.summary,
      tags: collectFrontmatterTags(note.data),
    });
  }

  for (const note of notes) {
    const noteId = graphNodeId(note.relativePath);
    const tags = [
      ...collectFrontmatterTags(note.data),
      ...collectInlineTags(note.content),
    ];

    for (const tag of tags) {
      const tagId = graphTagId(tag);
      if (!nodes.has(tagId)) {
        nodes.set(tagId, {
          id: tagId,
          type: 'tag',
          label: tag,
          href: nodeAnchor(tagId),
          slug: slugify(tag),
        });
      }
      pushUniqueLink(links, seenLinks, noteId, tagId, 'has-tag');
    }

    for (const target of collectWikiTargets(note.content)) {
      const targetNote = lookup.get(slugPath(target));
      if (!targetNote) continue;
      const targetId = graphNodeId(targetNote.relativePath);
      pushUniqueLink(links, seenLinks, noteId, targetId, 'wikilink');
    }
  }

  return {
    nodes: [...nodes.values()],
    links,
  };
}

export function writeObsidianGraph({ outputPath, vaultRoot }) {
  const graph = buildObsidianGraph({ vaultRoot });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(`${outputPath}.tmp`, `${JSON.stringify(graph, null, 2)}\n`);
  fs.renameSync(`${outputPath}.tmp`, outputPath);
  return graph;
}
