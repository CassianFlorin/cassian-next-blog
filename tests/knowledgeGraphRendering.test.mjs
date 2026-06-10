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
  /buildKnowledgeMapModel/,
  'Knowledge graph rendering should use the semantic map model.',
);

const nodeCanvasObjectSource =
  componentSource.split('nodeCanvasObject={(')[1] || '';

assert.match(
  nodeCanvasObjectSource,
  /drawRoundedRect/,
  'Knowledge graph node drawing should use rounded rectangular nodes.',
);

assert.equal(
  nodeCanvasObjectSource.includes('createRadialGradient'),
  false,
  'Knowledge graph node drawing should avoid creating gradients inside the per-frame canvas callback.',
);

assert.equal(
  nodeCanvasObjectSource.includes('ctx.drawImage'),
  false,
  'Knowledge graph node drawing should not render old point sprites.',
);

assert.match(
  nodeCanvasObjectSource,
  /graphNode\.visualType === 'category'[\s\S]*graphNode\.visualType === 'tag'[\s\S]*globalScale > LABEL_ZOOM_THRESHOLD \+ 0\.8/,
  'Knowledge graph text should prioritize categories, important tags, and focused or zoomed nodes.',
);

assert.match(
  componentSource,
  /const graphTopology = useMemo/,
  'Knowledge graph should precompute topology from visible links.',
);

assert.match(
  componentSource,
  /forceX[\s\S]*categoryAnchors[\s\S]*forceY/,
  'Knowledge graph should pull tags and posts toward their category anchors.',
);

assert.match(
  componentSource,
  /link\.type === 'category-tag'/,
  'Knowledge graph should render category-to-tag links distinctly.',
);

assert.match(
  componentSource,
  /const handleNodeHover = useCallback[\s\S]*current\?\.id === node\?\.id/,
  'Knowledge graph hover handling should skip state updates when the hovered node is unchanged.',
);

console.log('knowledgeGraphRendering tests passed');
