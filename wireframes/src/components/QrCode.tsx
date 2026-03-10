import React from 'react';

// ─── Minimal QR Code Generator (Version 2-6, ECC-M, Byte mode) ─────────────
// Produces a valid, scannable QR code as an SVG — no external dependencies.

// GF(256) arithmetic for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let v = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = v;
    GF_LOG[v] = i;
    v = (v << 1) ^ (v >= 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]!;
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a]! + GF_LOG[b]!) % 255]!;
}

function rsGenPoly(nsym: number): number[] {
  let g = [1];
  for (let i = 0; i < nsym; i++) {
    const ng: number[] = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      ng[j] = ng[j]! ^ gfMul(g[j]!, GF_EXP[i]!);
      ng[j + 1] = ng[j + 1]! ^ g[j]!;
    }
    g = ng;
  }
  return g;
}

function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGenPoly(nsym);
  const res = new Array(data.length + nsym).fill(0);
  for (let i = 0; i < data.length; i++) res[i] = data[i]!;
  for (let i = 0; i < data.length; i++) {
    const coef = res[i]!;
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] = res[i + j]! ^ gfMul(gen[j]!, coef);
      }
    }
  }
  return res.slice(data.length);
}

// ─── QR Version/ECC tables (byte mode, ECC-M) ───
interface VersionInfo {
  totalCodewords: number;
  ecPerBlock: number;
  blocks: number;
  dataCodewords: number;
}

// Versions 1-6 with ECC level M
const VERSION_TABLE: VersionInfo[] = [
  { totalCodewords: 26, ecPerBlock: 10, blocks: 1, dataCodewords: 16 }, // v1
  { totalCodewords: 44, ecPerBlock: 16, blocks: 1, dataCodewords: 28 }, // v2
  { totalCodewords: 70, ecPerBlock: 26, blocks: 1, dataCodewords: 44 }, // v3
  { totalCodewords: 100, ecPerBlock: 18, blocks: 2, dataCodewords: 64 }, // v4
  { totalCodewords: 134, ecPerBlock: 24, blocks: 2, dataCodewords: 86 }, // v5
  { totalCodewords: 172, ecPerBlock: 16, blocks: 4, dataCodewords: 136 }, // v6
];

function selectVersion(dataLen: number): { version: number; info: VersionInfo } {
  for (let i = 0; i < VERSION_TABLE.length; i++) {
    const info = VERSION_TABLE[i]!;
    // Byte mode header: 4 bits mode + 8 bits length (v1-9) = 12 bits → 2 bytes overhead
    if (info.dataCodewords >= dataLen + 3) {
      return { version: i + 1, info };
    }
  }
  // Fallback to version 6
  return { version: 6, info: VERSION_TABLE[5]! };
}

// ─── Bit stream helpers ───
class BitStream {
  private bits: number[] = [];
  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }
  getBytes(): number[] {
    // Pad to byte boundary
    while (this.bits.length % 8 !== 0) this.bits.push(0);
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      bytes.push(
        (this.bits[i]! << 7) |
          (this.bits[i + 1]! << 6) |
          (this.bits[i + 2]! << 5) |
          (this.bits[i + 3]! << 4) |
          (this.bits[i + 4]! << 3) |
          (this.bits[i + 5]! << 2) |
          (this.bits[i + 6]! << 1) |
          this.bits[i + 7]!,
      );
    }
    return bytes;
  }
  get length() {
    return this.bits.length;
  }
}

function encodeData(text: string, dataCodewords: number): number[] {
  const bs = new BitStream();
  // Byte mode indicator
  bs.put(0b0100, 4);
  // Character count (8 bits for versions 1-9)
  bs.put(text.length, 8);
  // Data
  for (let i = 0; i < text.length; i++) {
    bs.put(text.charCodeAt(i), 8);
  }
  // Terminator
  const remaining = dataCodewords * 8 - bs.length;
  bs.put(0, Math.min(4, remaining));

  const bytes = bs.getBytes();
  // Pad to data capacity
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bytes.length < dataCodewords) {
    bytes.push(padBytes[padIdx % 2]!);
    padIdx++;
  }
  return bytes.slice(0, dataCodewords);
}

// ─── Interleave blocks and add ECC ───
function buildCodewords(data: number[], info: VersionInfo): number[] {
  const { ecPerBlock, blocks, dataCodewords } = info;
  const shortBlockData = Math.floor(dataCodewords / blocks);
  const longBlocks = dataCodewords % blocks;

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;

  for (let b = 0; b < blocks; b++) {
    const blockLen = shortBlockData + (b >= blocks - longBlocks ? 1 : 0);
    const blockData = data.slice(offset, offset + blockLen);
    dataBlocks.push(blockData);
    ecBlocks.push(rsEncode(blockData, ecPerBlock));
    offset += blockLen;
  }

  // Interleave data
  const result: number[] = [];
  const maxDataLen = shortBlockData + (longBlocks > 0 ? 1 : 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < blocks; b++) {
      if (i < dataBlocks[b]!.length) result.push(dataBlocks[b]![i]!);
    }
  }
  // Interleave EC
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks; b++) {
      result.push(ecBlocks[b]![i]!);
    }
  }
  return result;
}

// ─── Module placement ───
type Matrix = (number | null)[][];

function createMatrix(size: number): Matrix {
  return Array.from({ length: size }, () => new Array(size).fill(null) as (number | null)[]);
}

function placeFinderPattern(matrix: Matrix, row: number, col: number) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r,
        mc = col + c;
      if (mr < 0 || mr >= matrix.length || mc < 0 || mc >= matrix.length) continue;
      if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
        const v = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4) ? 1 : 0;
        matrix[mr]![mc] = v;
      } else {
        matrix[mr]![mc] = 0;
      }
    }
  }
}

function placeAlignmentPattern(matrix: Matrix, row: number, col: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const v = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0) ? 1 : 0;
      matrix[row + r]![col + c] = v;
    }
  }
}

// Alignment pattern positions for versions 2-6
const ALIGNMENT_POSITIONS: Record<number, number[]> = {
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
};

function placeTimingPatterns(matrix: Matrix) {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6]![i] === null) matrix[6]![i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i]![6] === null) matrix[i]![6] = i % 2 === 0 ? 1 : 0;
  }
}

function reserveFormatInfo(matrix: Matrix) {
  const size = matrix.length;
  // Around top-left finder
  for (let i = 0; i <= 8; i++) {
    if (matrix[8]![i] === null) matrix[8]![i] = 0;
    if (matrix[i]![8] === null) matrix[i]![8] = 0;
  }
  // Around top-right finder
  for (let i = 0; i <= 7; i++) {
    if (matrix[8]![size - 1 - i] === null) matrix[8]![size - 1 - i] = 0;
  }
  // Around bottom-left finder
  for (let i = 0; i <= 7; i++) {
    if (matrix[size - 1 - i]![8] === null) matrix[size - 1 - i]![8] = 0;
  }
  // Dark module
  matrix[size - 8]![8] = 1;
}

function placeDataBits(matrix: Matrix, codewords: number[]): void {
  const size = matrix.length;
  const bits: number[] = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b--) bits.push((cw >> b) & 1);
  }

  let bitIdx = 0;
  let col = size - 1;
  let goingUp = true;

  while (col >= 0) {
    if (col === 6) {
      col--;
      continue;
    } // Skip timing column

    const rowRange = goingUp
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rowRange) {
      for (const dc of [0, -1]) {
        const c = col + dc;
        if (c < 0) continue;
        if (matrix[row]![c] !== null) continue;
        matrix[row]![c] = bitIdx < bits.length ? bits[bitIdx]! : 0;
        bitIdx++;
      }
    }

    col -= 2;
    goingUp = !goingUp;
  }
}

// ─── Masking ───
type MaskFn = (row: number, col: number) => boolean;

const MASK_FUNCTIONS: MaskFn[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function isDataModule(matrix: Matrix, reservedMatrix: Matrix, row: number, col: number): boolean {
  return reservedMatrix[row]![col] === null && matrix[row]![col] !== null;
}

function applyMask(matrix: Matrix, reserved: Matrix, maskIdx: number): Matrix {
  const size = matrix.length;
  const result = matrix.map((row) => [...row]);
  const fn = MASK_FUNCTIONS[maskIdx]!;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isDataModule(matrix, reserved, r, c) && fn(r, c)) {
        result[r]![c] = result[r]![c]! ^ 1;
      }
    }
  }
  return result;
}

// Format info bits (ECC level M = 0b00)
const FORMAT_INFO_STRINGS: number[] = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];

function placeFormatInfo(matrix: Matrix, maskIdx: number): void {
  const size = matrix.length;
  const bits = FORMAT_INFO_STRINGS[maskIdx]!;

  // Horizontal: left of top-left, right of top-right
  const hPositions = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [8, size - 8],
    [8, size - 7],
    [8, size - 6],
    [8, size - 5],
    [8, size - 4],
    [8, size - 3],
    [8, size - 2],
  ];

  // Vertical: below top-left, above bottom-left
  const vPositions = [
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [7, 8],
    [8, 8],
    [size - 7, 8],
    [size - 6, 8],
    [size - 5, 8],
    [size - 4, 8],
    [size - 3, 8],
    [size - 2, 8],
    [size - 1, 8],
  ];

  for (let i = 0; i < 15; i++) {
    const bit = (bits >> (14 - i)) & 1;
    const hPos = hPositions[i]!;
    const hr = hPos[0]!,
      hc = hPos[1]!;
    matrix[hr]![hc] = bit;
    const vPos = vPositions[i]!;
    const vr = vPos[0]!,
      vc = vPos[1]!;
    matrix[vr]![vc] = bit;
  }
}

// ─── Penalty scoring for mask selection ───
function penaltyScore(matrix: Matrix): number {
  const size = matrix.length;
  let score = 0;

  // Rule 1: Consecutive same-color in row/col (5+ → 3+extra)
  for (let r = 0; r < size; r++) {
    let count = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r]![c] === matrix[r]![c - 1]) {
        count++;
      } else {
        if (count >= 5) score += count - 2;
        count = 1;
      }
    }
    if (count >= 5) score += count - 2;
  }
  for (let c = 0; c < size; c++) {
    let count = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r]![c] === matrix[r - 1]![c]) {
        count++;
      } else {
        if (count >= 5) score += count - 2;
        count = 1;
      }
    }
    if (count >= 5) score += count - 2;
  }

  // Rule 2: 2×2 same-color blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = matrix[r]![c];
      if (v === matrix[r]![c + 1] && v === matrix[r + 1]![c] && v === matrix[r + 1]![c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 4: Proportion of dark modules
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r]![c] === 1) dark++;
    }
  }
  const pct = (dark * 100) / (size * size);
  const prev5 = Math.floor(pct / 5) * 5;
  const next5 = prev5 + 5;
  score += Math.min(Math.abs(prev5 - 50), Math.abs(next5 - 50)) * 2;

  return score;
}

// ─── Main QR generation ───
function generateQR(text: string): number[][] {
  const { version, info } = selectVersion(text.length);
  const size = version * 4 + 17;

  // 1. Create matrix and place function patterns
  const matrix = createMatrix(size);

  // Finder patterns
  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, 0, size - 7);
  placeFinderPattern(matrix, size - 7, 0);

  // Alignment patterns (version >= 2)
  if (version >= 2) {
    const positions = ALIGNMENT_POSITIONS[version];
    if (positions) {
      for (const r of positions) {
        for (const c of positions) {
          // Skip if overlapping with finder patterns
          if (r <= 8 && c <= 8) continue;
          if (r <= 8 && c >= size - 8) continue;
          if (r >= size - 8 && c <= 8) continue;
          placeAlignmentPattern(matrix, r, c);
        }
      }
    }
  }

  // Timing patterns
  placeTimingPatterns(matrix);

  // Reserve format info area
  reserveFormatInfo(matrix);

  // Save reserved state (before data placement)
  const reserved = matrix.map((row) => [...row]);

  // 2. Encode data
  const data = encodeData(text, info.dataCodewords);
  const codewords = buildCodewords(data, info);

  // 3. Place data
  placeDataBits(matrix, codewords);

  // 4. Try all masks, pick best
  let bestMask = 0;
  let bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    const masked = applyMask(matrix, reserved, m);
    placeFormatInfo(masked, m);
    const s = penaltyScore(masked);
    if (s < bestScore) {
      bestScore = s;
      bestMask = m;
    }
  }

  // 5. Apply best mask
  const final = applyMask(matrix, reserved, bestMask);
  placeFormatInfo(final, bestMask);

  return final.map((row) => row.map((v) => v ?? 0));
}

// ─── React Component ───
interface QrCodeSvgProps {
  data: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ data, size = 128, fgColor = '#000000', bgColor = '#ffffff' }) => {
  if (!data) return null;

  const modules = generateQR(data);
  const moduleCount = modules.length;
  const quietZone = 2; // 2-module quiet zone
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = size / totalModules;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className="block"
    >
      {/* Background */}
      <rect width={size} height={size} fill={bgColor} />
      {/* Modules */}
      {modules.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={(c + quietZone) * cellSize}
              y={(r + quietZone) * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill={fgColor}
            />
          ) : null,
        ),
      )}
    </svg>
  );
};
