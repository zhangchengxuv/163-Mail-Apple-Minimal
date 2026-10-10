import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const release = resolve('release');
mkdirSync(release, { recursive: true });
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
const output = resolve(release, `163-mail-minimal-v${version}.zip`);
rmSync(output, { force: true });
const dist = resolve('dist');
if (process.platform === 'win32') {
  // Windows ships bsdtar, which supports ZIP creation through -a.
  execFileSync('tar', ['-a', '-c', '-f', output, '-C', dist, '.'], { stdio: 'inherit' });
} else {
  // GitHub-hosted Ubuntu runners provide zip; archive contents start at dist/ root.
  execFileSync('zip', ['-q', '-r', output, '.'], { cwd: dist, stdio: 'inherit' });
}
console.log(`Created ${output}`);
