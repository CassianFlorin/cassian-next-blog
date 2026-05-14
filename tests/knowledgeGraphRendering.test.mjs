import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentSource = readFileSync(
  join(__dirname, '../components/KnowledgeGraphExplorer.tsx'),
  'utf8',
);

assert.match(
  componentSource,
  /const getNodeSprite =/,
  'Knowledge graph node drawing should cache gradient node sprites.',
);

const nodeCanvasObjectSource =
  componentSource.split('nodeCanvasObject={(')[1] || '';

assert.match(
  nodeCanvasObjectSource,
  /ctx\.drawImage/,
  'Knowledge graph node drawing should draw cached sprites per frame.',
);

assert.equal(
  nodeCanvasObjectSource.includes('createRadialGradient'),
  false,
  'Knowledge graph node drawing should avoid creating gradients inside the per-frame canvas callback.',
);

assert.match(
  componentSource,
  /const showLabel =[\s\S]*globalScale >[\s\S]*hoverNode/,
  'Knowledge graph labels should be gated by zoom or hover instead of always drawn.',
);

console.log('knowledgeGraphRendering tests passed');
