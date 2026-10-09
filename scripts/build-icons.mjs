import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve } from 'node:path';

const sizes = [16, 32, 48, 128, 256];
const source = resolve('src/assets/icon.svg');
const outputDir = resolve('public/icons');
mkdirSync(outputDir, { recursive: true });
copyFileSync(source, resolve(outputDir, 'icon.svg'));

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, checksum]);
};

function pixelFor(size, x, y) {
  const radius = size * 0.22;
  const inset = size * 0.063;
  const insideRoundRect = x >= inset && x < size - inset && y >= inset && y < size - inset &&
    (x >= inset + radius || y >= inset + radius || Math.hypot(x - (inset + radius), y - (inset + radius)) <= radius ||
     Math.hypot(x - (size - inset - radius), y - (inset + radius)) <= radius ||
     Math.hypot(x - (inset + radius), y - (size - inset - radius)) <= radius ||
     Math.hypot(x - (size - inset - radius), y - (size - inset - radius)) <= radius);
  if (!insideRoundRect) return [0, 0, 0, 0];
  const t = (x + y) / (size * 2);
  let color = [Math.round(93 - t * 57), Math.round(157 - t * 52), Math.round(255 - t * 35), 255];
  const left = size * 0.22, right = size * 0.78, top = size * 0.29, bottom = size * 0.72;
  if (x >= left && x <= right && y >= top && y <= bottom) color = [255, 255, 255, 255];
  const line = Math.max(1, size * 0.037);
  const mid = size * 0.5;
  const envelopeLine = y > top && y < size * 0.55 && Math.abs(y - (top + Math.abs(x - mid) * 0.48)) < line;
  if (envelopeLine) color = [59, 124, 228, 255];
  return color;
}

function png(size) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const start = y * (size * 4 + 1);
    rows[start] = 0;
    for (let x = 0; x < size; x += 1) Buffer.from(pixelFor(size, x + 0.5, y + 0.5)).copy(rows, start + 1 + x * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of sizes) {
  const file = `icon${size}.png`;
  const buffer = png(size);
  writeFileSync(resolve('src/assets', file), buffer);
  writeFileSync(resolve(outputDir, file), buffer);
}

// Read once so build failures clearly point to a missing editable SVG source.
readFileSync(source);
console.log('Generated original extension icons.');
