import React from 'react';

interface BarcodeStripesProps {
  code: string;
  width?: number;
  height?: number;
}

/**
 * SVG barcode generator component.
 * Generates a deterministic barcode-like stripe pattern from a string code.
 * Each character in the code produces a set of bars based on its char code.
 */
export const BarcodeStripes: React.FC<BarcodeStripesProps> = ({ code, width = 180, height = 50 }) => {
  if (!code) return null;

  // Generate deterministic bar pattern from code
  const bars: Array<{ x: number; w: number }> = [];
  const availableWidth = width - 20; // 10px padding each side
  const barsPerChar = 4;
  let xPos = 10; // start with padding

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);

    // Generate bars based on character code
    for (let j = 0; j < barsPerChar; j++) {
      const seed = (charCode * (j + 1) + i * 7) % 10;
      const barWidth = seed < 3 ? 1 : seed < 6 ? 1.5 : seed < 8 ? 2 : 2.5;
      const gapWidth = seed < 4 ? 1.5 : seed < 7 ? 2 : 2.5;

      bars.push({ x: xPos, w: barWidth });
      xPos += barWidth + gapWidth;
    }

    // Small gap between character groups
    xPos += 1;
  }

  // Scale bars to fit width
  const actualWidth = xPos;
  const scale = availableWidth / actualWidth;

  // Start/stop guard bars
  const guardBars = [
    { x: 4, w: 1.5 },
    { x: 6.5, w: 1.5 },
    { x: width - 8, w: 1.5 },
    { x: width - 5.5, w: 1.5 },
  ];

  // Center guard
  const centerX = width / 2;
  const centerGuards = [
    { x: centerX - 3, w: 1 },
    { x: centerX - 1, w: 1 },
    { x: centerX + 1, w: 1 },
  ];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {/* Guard bars (slightly taller) */}
      {guardBars.map((bar, i) => (
        <rect key={`guard-${i}`} x={bar.x} y={2} width={bar.w} height={height - 4} fill="currentColor" />
      ))}

      {/* Center guard bars (slightly taller) */}
      {centerGuards.map((bar, i) => (
        <rect key={`center-${i}`} x={bar.x} y={3} width={bar.w} height={height - 6} fill="currentColor" />
      ))}

      {/* Data bars */}
      {bars.map((bar, i) => (
        <rect
          key={`bar-${i}`}
          x={10 + bar.x * scale}
          y={4}
          width={Math.max(bar.w * scale, 0.5)}
          height={height - 10}
          fill="currentColor"
          opacity={0.85}
        />
      ))}
    </svg>
  );
};
