import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifestPath = resolve(dist, 'manifest.json');
if (!existsSync(manifestPath)) throw new Error('dist/manifest.json is missing. Run Vite build first.');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.manifest_version !== 3) throw new Error('Manifest V3 is required.');
if (manifest.permissions?.some((permission) => permission !== 'storage')) throw new Error('Unexpected permission in manifest.');
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(['https://mail.163.com/*'])) throw new Error('Unexpected host permission.');
for (const content of manifest.content_scripts ?? []) {
  for (const file of [...(content.js ?? []), ...(content.css ?? [])]) {
    if (!existsSync(resolve(dist, file))) throw new Error(`Manifest references missing asset: ${file}`);
  }
}
for (const page of [manifest.action?.default_popup, manifest.options_page]) {
  if (!page || !existsSync(resolve(dist, page))) throw new Error(`Manifest references missing page: ${page}`);
}
console.log('Manifest is valid and all declared extension assets exist.');
