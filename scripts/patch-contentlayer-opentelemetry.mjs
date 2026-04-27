import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const target = path.join(
  process.cwd(),
  'node_modules',
  '@contentlayer2',
  'utils',
  'dist',
  'tracing-effect',
  'index.js',
);

const namedImport =
  "import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';";
const defaultImport =
  "import semanticConventions from '@opentelemetry/semantic-conventions';\nconst { SemanticResourceAttributes } = semanticConventions;";

if (existsSync(target)) {
  const source = readFileSync(target, 'utf8');
  if (source.includes(namedImport)) {
    writeFileSync(target, source.replace(namedImport, defaultImport));
    console.log('Patched Contentlayer OpenTelemetry import.');
  }
}
