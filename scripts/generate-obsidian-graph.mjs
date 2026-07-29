#!/usr/bin/env node

import path from 'node:path';
import { existsSync } from 'node:fs';
import { writeObsidianGraph } from '../lib/obsidianGraph.mjs';

const ROOT = process.cwd();
const DEFAULT_OUTPUT = path.join(ROOT, 'generated', 'obsidian-graph.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    outputPath: process.env.OBSIDIAN_GRAPH_OUTPUT || DEFAULT_OUTPUT,
    vaultRoot: process.env.OBSIDIAN_VAULT_ROOT || '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--vault' && args[i + 1]) {
      parsed.vaultRoot = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      parsed.outputPath = args[++i];
    }
  }

  return {
    outputPath: path.isAbsolute(parsed.outputPath)
      ? parsed.outputPath
      : path.join(ROOT, parsed.outputPath),
    vaultRoot: parsed.vaultRoot ? path.resolve(parsed.vaultRoot) : '',
  };
}

function main() {
  const { outputPath, vaultRoot } = parseArgs();

  if (!vaultRoot) {
    // The vault only exists on the author's machine, so any other environment
    // (CI, Vercel) would otherwise overwrite a real committed graph with an
    // empty one. Seed the file if it is missing, but never clobber it.
    if (existsSync(outputPath)) {
      console.log(
        `Obsidian graph skipped: OBSIDIAN_VAULT_ROOT is not set, keeping existing ${path.relative(ROOT, outputPath)}.`,
      );
      return;
    }

    const graph = writeObsidianGraph({ outputPath, vaultRoot: '' });
    console.log(
      `Obsidian graph skipped: OBSIDIAN_VAULT_ROOT is not set. Wrote empty graph to ${path.relative(ROOT, outputPath)}.`,
    );
    console.log(
      `Generated ${graph.nodes.length} Obsidian nodes and ${graph.links.length} links.`,
    );
    return;
  }

  const graph = writeObsidianGraph({ outputPath, vaultRoot });
  console.log(`Obsidian graph source: ${vaultRoot}`);
  console.log(`Obsidian graph output: ${path.relative(ROOT, outputPath)}`);
  console.log(
    `Generated ${graph.nodes.length} Obsidian nodes and ${graph.links.length} links.`,
  );
}

main();
