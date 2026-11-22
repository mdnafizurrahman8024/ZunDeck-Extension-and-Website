import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT_DIR, 'apps', 'extension', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 1. Vector SVG Icon
const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090e17"/>
    </linearGradient>
    <linearGradient id="deckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>

  <!-- Squircle Base -->
  <rect x="6" y="6" width="116" height="116" rx="26" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="2"/>

  <!-- Back Deck Card -->
  <rect x="28" y="24" width="72" height="80" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5" transform="rotate(-6 64 64)" opacity="0.75"/>

  <!-- Front Deck Card -->
  <rect x="28" y="24" width="72" height="80" rx="10" fill="#101726" stroke="#0d9488" stroke-width="2"/>

  <!-- Geometric Emblem 'Z' on Deck Card -->
  <path d="M 44 42 L 84 42 L 52 78 L 84 78" fill="none" stroke="url(#deckGrad)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="84" cy="42" r="4.5" fill="#38bdf8"/>
  <circle cx="44" cy="78" r="4.5" fill="#14b8a6"/>
</svg>`;

fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), SVG_ICON, 'utf8');

// 2. Pure Node PNG Chunk Generator
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const header = Buffer.alloc(4);
  header.writeUInt32BE(len, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crcVal, 0);

  return Buffer.concat([header, typeBuf, data, footer]);
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Scanlines with filter byte 0
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = x / width;
      const ny = y / height;

      // Squircle distance
      const dx = Math.abs(nx - 0.5) * 2;
      const dy = Math.abs(ny - 0.5) * 2;
      const dist = Math.pow(Math.pow(dx, 4) + Math.pow(dy, 4), 0.25);

      if (dist < 0.95) {
        // Deck theme colors: Deep slate with emerald-teal core
        const isCore = dist < 0.65;
        if (isCore) {
          rawData[pxOffset] = 13;     // R (Teal)
          rawData[pxOffset + 1] = 148; // G
          rawData[pxOffset + 2] = 136; // B
          rawData[pxOffset + 3] = 255; // Alpha
        } else {
          rawData[pxOffset] = 15;     // R (Slate)
          rawData[pxOffset + 1] = 23;  // G
          rawData[pxOffset + 2] = 42;  // B
          rawData[pxOffset + 3] = 255;
        }
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0; // Transparent outside squircle
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

for (const size of [16, 32, 48, 128]) {
  const pngBuf = generatePng(size);
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), pngBuf);
  console.log(`Generated ${size}x${size} icon: ${pngBuf.length} bytes`);
}

console.log('✓ All extension icons generated successfully.');
