import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

for (const size of [16, 32, 48, 128]) {
  const path = resolve('dist/icons', `icon${size}.png`);
  const data = readFileSync(path);
  if (data.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${path} is not a PNG.`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width !== size || height !== size) throw new Error(`${path} is ${width}×${height}, expected ${size}×${size}.`);
}
console.log('Extension icon dimensions are valid.');
