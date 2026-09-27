import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconPaths = [
  resolve(root, "desktop/assets/roco-kingdom-world-guide.ico"),
  resolve(root, "dist/assets/favicon.ico")
];
const sizes = [16, 24, 32, 48, 64, 128, 256];
const colors = {
  background: [17, 26, 44, 255],
  frame: [217, 188, 129, 255],
  mark: [246, 244, 237, 255]
};
const hexagon = [[32, 7], [54, 20], [54, 44], [32, 57], [10, 44], [10, 20]];
const letter = [
  [[23, 41], [23, 23], [34, 23]],
  [[34, 23], [37.4, 24.2], [39.2, 26.8], [39.2, 30], [37.5, 32.4], [34.2, 33.4], [23, 33.4]],
  [[35, 33.4], [44, 42]]
];

function distanceToSegment(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared));
  return Math.hypot(px - (x1 + projection * dx), py - (y1 + projection * dy));
}

function onPolyline(x, y, points, width) {
  for (let index = 0; index < points.length - 1; index += 1) {
    if (distanceToSegment(x, y, points[index], points[index + 1]) <= width / 2) return true;
  }
  return false;
}

function insideRoundedSquare(x, y, radius) {
  if (x < 0 || y < 0 || x > 64 || y > 64) return false;
  const nearestX = Math.max(radius, Math.min(64 - radius, x));
  const nearestY = Math.max(radius, Math.min(64 - radius, y));
  return Math.hypot(x - nearestX, y - nearestY) <= radius;
}

function colorAt(x, y) {
  if (!insideRoundedSquare(x, y, 18)) return [0, 0, 0, 0];
  if (onPolyline(x, y, [...hexagon, hexagon[0]], 2.5)) return colors.frame;
  if (letter.some((stroke) => onPolyline(x, y, stroke, 3))) return colors.mark;
  return colors.background;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const body = Buffer.concat([name, data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function renderPng(size) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const sampleCount = 4;
  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (size * 4 + 1);
    pixels[rowOffset] = 0;
    for (let x = 0; x < size; x += 1) {
      const sums = [0, 0, 0, 0];
      for (let sampleY = 0; sampleY < sampleCount; sampleY += 1) {
        for (let sampleX = 0; sampleX < sampleCount; sampleX += 1) {
          const pointX = ((x + (sampleX + 0.5) / sampleCount) * 64) / size;
          const pointY = ((y + (sampleY + 0.5) / sampleCount) * 64) / size;
          const color = colorAt(pointX, pointY);
          for (let channel = 0; channel < 4; channel += 1) sums[channel] += color[channel];
        }
      }
      const pixelOffset = rowOffset + 1 + x * 4;
      for (let channel = 0; channel < 4; channel += 1) pixels[pixelOffset + channel] = Math.round(sums[channel] / (sampleCount * sampleCount));
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(pixels, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function buildIco() {
  const images = sizes.map((size) => ({ size, bytes: renderPng(size) }));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + images.length * 16;
  const entries = images.map(({ size, bytes }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size === 256 ? 0 : size;
    entry[1] = size === 256 ? 0 : size;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(bytes.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += bytes.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ bytes }) => bytes)]);
}

const icon = buildIco();
for (const outputPath of iconPaths) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, icon);
}
process.stdout.write(`Generated ${iconPaths.length} multi-resolution ICO files (${icon.byteLength} bytes each).\n`);
