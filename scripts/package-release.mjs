import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const release = resolve('release');
mkdirSync(release, { recursive: true });
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const output = resolve(release, `163-mail-minimal-v${version}.zip`);
rmSync(output, { force: true });
execFileSync('tar', ['-a', '-c', '-f', output, '-C', resolve('dist'), '.'], { stdio: 'inherit' });
console.log(`Created ${output}`);
