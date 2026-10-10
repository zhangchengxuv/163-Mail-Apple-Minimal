import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const sourceManifest = JSON.parse(readFileSync(resolve('public/manifest.json'), 'utf8'));
const builtManifestPath = resolve('dist/manifest.json');

if (!existsSync(builtManifestPath)) {
  throw new Error('dist/manifest.json is missing. Run npm run build first.');
}

const builtManifest = JSON.parse(readFileSync(builtManifestPath, 'utf8'));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json must contain a stable X.Y.Z version, received ${JSON.stringify(version)}.`);
}
for (const [name, value] of Object.entries({
  'public/manifest.json': sourceManifest.version,
  'dist/manifest.json': builtManifest.version
})) {
  if (value !== version) throw new Error(`${name} version ${JSON.stringify(value)} does not match package.json version ${version}.`);
}

const tag = process.env.RELEASE_TAG;
if (tag !== undefined) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`Release tag must be a stable vX.Y.Z tag, received ${JSON.stringify(tag)}.`);
  }
  if (tag.slice(1) !== version) {
    throw new Error(`Release tag ${tag} does not match project version ${version}.`);
  }
}

console.log(`Version consistency verified: ${tag ? `${tag} = ` : ''}${version}`);
