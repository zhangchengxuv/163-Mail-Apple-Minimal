import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const release = resolve('release');
mkdirSync(release, { recursive: true });
const output = resolve(release, '163-mail-minimal-v1.0.0.zip');
rmSync(output, { force: true });
execFileSync('tar', ['-a', '-c', '-f', output, '-C', resolve('dist'), '.'], { stdio: 'inherit' });
console.log(`Created ${output}`);
