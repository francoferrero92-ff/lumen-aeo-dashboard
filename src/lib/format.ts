const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatCompact = (n: number) => compact.format(n);

export const formatPercent = (ratio: number, digits = 0) =>
  `${(ratio * 100).toFixed(digits)}%`;

/** Percentage-point delta with an explicit sign, e.g. "+3.1 pts". */
export const formatPts = (delta: number, digits = 1) => {
  const v = Number(delta.toFixed(digits));
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(digits)} pts`;
};

const dayFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const longFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const formatDay = (d: Date) => dayFmt.format(d);
export const formatLongDay = (d: Date) => longFmt.format(d);

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
