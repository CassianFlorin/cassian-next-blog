import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentSource = readFileSync(
  join(__dirname, '../components/KnowledgeGraphExplorer.tsx'),
  'utf8',
);

assert.equal(
  componentSource.includes('createRadialGradient'),
  false,
  'Knowledge graph node drawing should avoid per-frame radial gradients.',
);

assert.match(
  componentSource,
  /const showLabel =[\s\S]*globalScale >[\s\S]*hoverNode/,
  'Knowledge graph labels should be gated by zoom or hover instead of always drawn.',
);

console.log('knowledgeGraphRendering tests passed');
