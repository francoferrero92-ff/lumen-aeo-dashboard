/**
 * Minimal trend line: previous period in a de-emphasis tone, current period
 * in the accent, with an end dot. Decorative — the KPI value carries meaning.
 */
export function Sparkline({
  values,
  highlightLast,
  width = 112,
  height = 32,
}: {
  values: number[];
  /** How many trailing points belong to the current period. */
  highlightLast: number;
  width?: number;
  height?: number;
}) {
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const path = (pts: number[], offset: number) =>
    pts.map((v, i) => `${i ? "L" : "M"}${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`).join("");

  const split = values.length - highlightLast;
  const last = values.length - 1;

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path
        d={path(values.slice(0, split + 1), 0)}
        fill="none"
        stroke="var(--axis)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path(values.slice(split), split)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="series-mark"
      />
      <circle
        cx={x(last)}
        cy={y(values[last])}
        r={3.5}
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth={2}
        className="series-mark"
      />
    </svg>
  );
}
