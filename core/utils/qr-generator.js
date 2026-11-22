// Zero-dependency pure JavaScript QR Code Generator (SVG output)
// Encodes alphanumeric/binary URLs into standard QR Code matrix (Version 2-4)

function createPolynomial(coefficients) {
  return coefficients;
}

// Reed-Solomon GF(256) log and exp tables
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gfMultiply(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateEcc(data, eccCount) {
  const gen = rsGeneratorPoly(eccCount);
  const info = new Uint8Array(data.length + eccCount);
  info.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = info[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        info[i + j] ^= gfMultiply(gen[j], coef);
      }
    }
  }
  return info.slice(data.length);
}

// QR Matrix Builder (Version 3: 29x29 matrix, capacity ~53 alphanumeric/byte characters)
export function generateQrMatrix(text) {
  const size = 29; // Version 3
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));

  // Function to stamp Finder Patterns
  function stampFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            matrix[nr][nc] = 0;
          } else if (r === 0 || r === 6 || c === 0 || c === 6) {
            matrix[nr][nc] = 1;
          } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            matrix[nr][nc] = 1;
          } else {
            matrix[nr][nc] = 0;
          }
        }
      }
    }
  }

  // Stamp 3 Finders
  stampFinder(0, 0);
  stampFinder(0, size - 7);
  stampFinder(size - 7, 0);

  // Alignment pattern at (20, 20)
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.max(Math.abs(r), Math.abs(c)) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[22 + r][22 + c] = (isBorder || isCenter) ? 1 : 0;
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = (i % 2 === 0) ? 1 : 0;
    if (matrix[i][6] === null) matrix[i][6] = (i % 2 === 0) ? 1 : 0;
  }

  // Dark module
  matrix[4 * 3 + 9][8] = 1;

  // Encode byte data
  const utf8Bytes = new TextEncoder().encode(text);
  const dataBits = [];

  // Mode indicator: 0100 for Byte
  dataBits.push(0, 1, 0, 0);
  // Character count (8 bits for V3)
  const len = Math.min(utf8Bytes.length, 55);
  for (let b = 7; b >= 0; b--) dataBits.push((len >> b) & 1);

  // Append bytes
  for (let i = 0; i < len; i++) {
    const byte = utf8Bytes[i];
    for (let b = 7; b >= 0; b--) dataBits.push((byte >> b) & 1);
  }

  // Terminator
  while (dataBits.length % 8 !== 0) dataBits.push(0);

  const rawBytes = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) byteVal = (byteVal << 1) | dataBits[i + b];
    rawBytes.push(byteVal);
  }

  // Pad up to 44 codewords (V3-M capacity)
  const padPatterns = [0xec, 0x11];
  let pIdx = 0;
  while (rawBytes.length < 44) {
    rawBytes.push(padPatterns[pIdx % 2]);
    pIdx++;
  }

  // ECC generation (26 ecc codewords)
  const eccBytes = rsCalculateEcc(new Uint8Array(rawBytes), 26);
  const allCodewords = [...rawBytes, ...eccBytes];

  // Convert all codewords to bit stream
  const finalBits = [];
  for (const cw of allCodewords) {
    for (let b = 7; b >= 0; b--) finalBits.push((cw >> b) & 1);
  }

  // Place data bits in matrix (skipping function patterns)
  let bitIdx = 0;
  let dir = -1; // upward
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1; // skip vertical timing line
    const rows = dir === -1
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (matrix[row][c] === null) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply mask pattern 000: (row + col) % 2 === 0
          const mask = ((row + c) % 2 === 0) ? 1 : 0;
          matrix[row][c] = bit ^ mask;
        }
      }
    }
    dir = -dir;
  }

  // Stamp format info (mask 000 with Medium error correction)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  let fIdx = 0;
  for (let c = 0; c <= 8; c++) {
    if (c !== 6) matrix[8][c] = formatBits[fIdx++];
  }
  for (let r = 7; r >= 0; r--) {
    if (r !== 6) matrix[r][8] = formatBits[fIdx++];
  }

  fIdx = 0;
  for (let r = size - 1; r >= size - 7; r--) matrix[r][8] = formatBits[fIdx++];
  for (let c = size - 8; c < size; c++) matrix[8][c] = formatBits[fIdx++];

  return matrix;
}

export function generateQrSvg(text, options = {}) {
  const size = options.size || 110;
  const color = options.color || '#0d9488';
  const bgColor = options.bgColor || 'transparent';
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;
  const moduleSize = size / matrixSize;

  let pathData = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c] === 1) {
        const x = (c * moduleSize).toFixed(2);
        const y = (r * moduleSize).toFixed(2);
        const w = moduleSize.toFixed(2);
        pathData += `M${x},${y}h${w}v${w}h-${w}z `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="cv-smart-qr-svg" role="img" aria-label="QR Code to ${text}">
      ${bgColor !== 'transparent' ? `<rect width="100%" height="100%" fill="${bgColor}" rx="6"/>` : ''}
      <path d="${pathData.trim()}" fill="${color}"/>
    </svg>
  `.trim();
}
