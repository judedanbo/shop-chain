import { useState } from 'react';
import { useColors } from '@/context';

interface PriceHistoryEntry {
  date: string;
  selling: number;
  cost: number;
}

interface PriceMovementChartProps {
  priceHistory: PriceHistoryEntry[];
  width?: number;
  height?: number;
}

export const PriceMovementChart = ({ priceHistory, width = 520, height = 220 }: PriceMovementChartProps) => {
  const COLORS = useColors();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const padT = 24,
    padB = 36,
    padL = 56,
    padR = 16;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allPrices = priceHistory.flatMap((p) => [p.selling, p.cost]);
  const maxP = Math.max(...allPrices) * 1.08;
  const minP = Math.min(...allPrices) * 0.92;
  const rangeP = maxP - minP || 1;

  const toX = (i: number) => padL + (i / (priceHistory.length - 1)) * chartW;
  const toY = (v: number) => padT + (1 - (v - minP) / rangeP) * chartH;

  const sellingPoints = priceHistory.map((p, i) => `${toX(i)},${toY(p.selling)}`).join(' ');
  const costPoints = priceHistory.map((p, i) => `${toX(i)},${toY(p.cost)}`).join(' ');
  const sellingArea = `${padL},${toY(minP)} ${sellingPoints} ${toX(priceHistory.length - 1)},${toY(minP)}`;
  const costArea = `${padL},${toY(minP)} ${costPoints} ${toX(priceHistory.length - 1)},${toY(minP)}`;

  // Y-axis gridlines
  const gridSteps = 5;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minP + (rangeP / gridSteps) * i;
    return { y: toY(val), label: val.toFixed(0) };
  });

  return (
    <svg width={width} height={height} className="block overflow-visible">
      <defs>
        <linearGradient id="sellingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.15} />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={padL}
            y1={g.y}
            x2={width - padR}
            y2={g.y}
            stroke={COLORS.border}
            strokeWidth="0.5"
            strokeDasharray="4,4"
          />
          <text x={padL - 8} y={g.y + 4} fill={COLORS.textDim} fontSize="10" textAnchor="end" fontFamily="DM Sans">
            {g.label}
          </text>
        </g>
      ))}

      {/* X-axis labels */}
      {priceHistory.map((p, i) => (
        <text
          key={i}
          x={toX(i)}
          y={height - 8}
          fill={COLORS.textDim}
          fontSize="10"
          textAnchor="middle"
          fontFamily="DM Sans"
        >
          {p.date}
        </text>
      ))}

      {/* Area fills */}
      <polygon points={sellingArea} fill="url(#sellingGrad)" />
      <polygon points={costArea} fill="url(#costGrad)" />

      {/* Lines */}
      <polyline
        points={sellingPoints}
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      <polyline
        points={costPoints}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6,3"
      />

      {/* Data points & hover zones */}
      {priceHistory.map((p, i) => (
        <g
          key={i}
          onMouseEnter={() => setHoveredPoint(i)}
          onMouseLeave={() => setHoveredPoint(null)}
          className="cursor-pointer"
        >
          {/* Invisible hover zone */}
          <rect x={toX(i) - 16} y={padT} width={32} height={chartH} fill="transparent" />

          {/* Hover vertical line */}
          {hoveredPoint === i && (
            <line
              x1={toX(i)}
              y1={padT}
              x2={toX(i)}
              y2={padT + chartH}
              stroke={COLORS.borderLight}
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* Selling price dot */}
          <circle
            cx={toX(i)}
            cy={toY(p.selling)}
            r={hoveredPoint === i ? 5 : 3}
            fill={COLORS.primary}
            stroke={COLORS.bg}
            strokeWidth="2"
          />
          {/* Cost price dot */}
          <circle
            cx={toX(i)}
            cy={toY(p.cost)}
            r={hoveredPoint === i ? 4 : 2.5}
            fill={COLORS.accent}
            stroke={COLORS.bg}
            strokeWidth="2"
          />

          {/* Tooltip */}
          {hoveredPoint === i && (
            <g>
              <rect
                x={toX(i) - 72}
                y={Math.min(toY(p.selling), toY(p.cost)) - 58}
                width={144}
                height={50}
                rx="8"
                fill={COLORS.surface}
                stroke={COLORS.border}
              />
              <text
                x={toX(i)}
                y={Math.min(toY(p.selling), toY(p.cost)) - 40}
                fill={COLORS.primary}
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="DM Sans"
              >{`Sell: GH₵ ${p.selling.toFixed(2)}`}</text>
              <text
                x={toX(i)}
                y={Math.min(toY(p.selling), toY(p.cost)) - 24}
                fill={COLORS.accent}
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="DM Sans"
              >{`Cost: GH₵ ${p.cost.toFixed(2)}`}</text>
              <text
                x={toX(i)}
                y={Math.min(toY(p.selling), toY(p.cost)) - 9}
                fill={COLORS.success}
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="DM Sans"
              >{`Margin: ${((1 - p.cost / p.selling) * 100).toFixed(1)}%`}</text>
            </g>
          )}
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${padL}, 6)`}>
        <circle cx="0" cy="0" r="4" fill={COLORS.primary} />
        <text x="8" y="4" fill={COLORS.textMuted} fontSize="10" fontFamily="DM Sans">
          Selling Price
        </text>
        <circle cx="100" cy="0" r="4" fill={COLORS.accent} />
        <text x="108" y="4" fill={COLORS.textMuted} fontSize="10" fontFamily="DM Sans">
          Cost Price
        </text>
        <rect
          x="192"
          y="-4"
          width="8"
          height="8"
          rx="2"
          fill={COLORS.successBg}
          stroke={COLORS.success}
          strokeWidth="0.5"
        />
        <text x="204" y="4" fill={COLORS.textMuted} fontSize="10" fontFamily="DM Sans">
          Margin Zone
        </text>
      </g>
    </svg>
  );
};
