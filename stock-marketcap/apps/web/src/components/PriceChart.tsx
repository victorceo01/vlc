"use client";

interface Point {
  t: string;
  close: number;
}

export function PriceChart({ points }: { points: Point[] }) {
  if (!points || points.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400">
        No price history for this range.
      </div>
    );
  }

  const width = 720;
  const height = 224;
  const pad = { top: 10, right: 8, bottom: 20, left: 8 };
  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const x = (i: number) =>
    pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) =>
    pad.top + (1 - (v - min) / range) * (height - pad.top - pad.bottom);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join(" ");
  const areaPath = `${path} L${x(points.length - 1).toFixed(1)},${height - pad.bottom} L${x(0).toFixed(1)},${height - pad.bottom} Z`;

  const up = closes[closes.length - 1] >= closes[0];
  const stroke = up ? "#0F9D58" : "#DB4437";
  const fill = up ? "rgba(15,157,88,0.08)" : "rgba(219,68,55,0.08)";

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Price chart" preserveAspectRatio="none">
        <path d={areaPath} fill={fill} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{first.t}</span>
        <span>
          Low {min.toFixed(2)} · High {max.toFixed(2)}
        </span>
        <span>{last.t}</span>
      </div>
    </div>
  );
}
