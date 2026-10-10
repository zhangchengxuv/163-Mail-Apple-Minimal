import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const manifestPath = resolve(dist, 'manifest.json');
if (!existsSync(manifestPath)) throw new Error('dist/manifest.json is missing. Run Vite build first.');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (manifest.manifest_version !== 3) throw new Error('Manifest V3 is required.');
if (manifest.permissions?.some((permission) => permission !== 'storage')) throw new Error('Unexpected permission in manifest.');
const expectedHosts = ['https://mail.163.com/*', 'https://geocoding-api.open-meteo.com/*', 'https://api.open-meteo.com/*'];
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(expectedHosts)) throw new Error('Unexpected host permission.');
const worker = manifest.background?.service_worker;
if (!worker || !existsSync(resolve(dist, worker))) throw new Error('Manifest references a missing background service worker.');
const workerSource = readFileSync(resolve(dist, worker), 'utf8');
if (/^\s*(?:import|export)\s/m.test(workerSource)) throw new Error('Background service worker must be bundled without module imports.');
for (const content of manifest.content_scripts ?? []) {
  for (const file of [...(content.js ?? []), ...(content.css ?? [])]) {
    if (!existsSync(resolve(dist, file))) throw new Error(`Manifest references missing asset: ${file}`);
  }
  for (const script of content.js ?? []) {
    const source = readFileSync(resolve(dist, script), 'utf8');
    if (/^\s*(?:import|export)\s/m.test(source)) {
      throw new Error(`Content script must be a classic IIFE, not an ES module: ${script}`);
    }
  }
}
for (const page of [manifest.action?.default_popup, manifest.options_page]) {
  if (!page || !existsSync(resolve(dist, page))) throw new Error(`Manifest references missing page: ${page}`);
}
for (const icon of Object.values(manifest.icons ?? {})) {
  if (!existsSync(resolve(dist, icon))) throw new Error(`Manifest references missing icon: ${icon}`);
}
console.log('Manifest is valid and all declared extension assets exist.');
