import { spawn, spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const run = (args) => spawnSync(command, args, { stdio: 'inherit' });
const content = run(['vite', 'build', '--config', 'vite.content.config.ts']);
if (content.status !== 0) process.exit(content.status ?? 1);
const css = run(['node', 'scripts/build-content-css.mjs']);
if (css.status !== 0) process.exit(css.status ?? 1);
const app = run(['vite', 'build']);
if (app.status !== 0) process.exit(app.status ?? 1);

const children = [
  spawn(command, ['vite', 'build', '--config', 'vite.content.config.ts', '--watch'], { stdio: 'inherit' }),
  spawn(command, ['node', 'scripts/build-content-css.mjs', '--watch'], { stdio: 'inherit' }),
  spawn(command, ['vite', 'build', '--watch'], { stdio: 'inherit' })
];
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => children.forEach((child) => child.kill(signal)));
