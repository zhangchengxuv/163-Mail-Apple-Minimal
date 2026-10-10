import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const archive = resolve('release', `163-mail-minimal-v${version}.zip`);
if (!existsSync(archive)) throw new Error(`Release archive is missing: ${archive}`);

const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
const checksum = `${archive}.sha256`;
writeFileSync(checksum, `${digest}  ${basename(archive)}\n`, 'utf8');
console.log(`Wrote SHA256 checksum: ${checksum}`);
