import { mkdirSync, readFileSync, writeFileSync, watch } from 'node:fs';
import { resolve } from 'node:path';

const sources = [
  'tokens.css', 'common.css', 'header.css', 'sidebar.css', 'toolbar.css', 'mail-list.css',
  'compose.css', 'reader.css', 'welcome.css', 'responsive.css'
].map((file) => resolve('src/content/theme/styles', file));
const output = resolve('dist/assets/content.css');

function build() {
  mkdirSync(resolve('dist/assets'), { recursive: true });
  writeFileSync(output, `${sources.map((source) => readFileSync(source, 'utf8')).join('\n')}\n`, 'utf8');
  console.log('Generated dist/assets/content.css');
}

build();
if (process.argv.includes('--watch')) {
  for (const source of sources) watch(source, build);
}
