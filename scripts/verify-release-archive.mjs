import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const archive = resolve('release', `163-mail-minimal-v${version}.zip`);
if (!existsSync(archive)) throw new Error(`Release archive is missing: ${archive}`);

const archiveListCommand = process.platform === 'win32'
  ? ['tar', ['-tf', archive]]
  : ['unzip', ['-Z1', archive]];
const entries = execFileSync(archiveListCommand[0], archiveListCommand[1], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((entry) => entry.replace(/^\.\//, ''))
  .filter(Boolean);
const required = [
  'manifest.json',
  'assets/content.js',
  'assets/content.css',
  'assets/background.js',
  'icons/icon16.png',
  'icons/icon128.png',
  'src/popup/index.html',
  'src/options/index.html'
];
for (const entry of required) {
  if (!entries.includes(entry)) throw new Error(`Release archive is missing required extension asset: ${entry}`);
}
const forbidden = /^(?:dist|node_modules|tests|html|\.git)\//;
if (entries.some((entry) => forbidden.test(entry) || /(?:^|\/)package(?:-lock)?\.json$/.test(entry) || /\.ts$/.test(entry))) {
  throw new Error('Release archive contains source-only, test, or sensitive-path content.');
}

console.log(`Verified ${basename(archive)} with ${entries.length} loadable extension assets and no dist/ wrapper.`);
