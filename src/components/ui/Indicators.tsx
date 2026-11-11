import { ArrowDownRight, ArrowUpRight, Minus, Smile, Meh, Frown } from "lucide-react";
import type { Sentiment } from "@/lib/data";
import { cn } from "@/lib/format";

/**
 * Signed change. Color = direction × whether "up" is good for this metric,
 * and it always ships with an arrow so it never relies on color alone.
 */
export function Delta({
  value,
  label,
  higherIsBetter = true,
  threshold = 0.05,
  className,
}: {
  value: number;
  label: string;
  higherIsBetter?: boolean;
  threshold?: number;
  className?: string;
}) {
  const flat = Math.abs(value) < threshold;
  const good = flat ? null : value > 0 === higherIsBetter;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        good === null ? "text-ink-3" : good ? "text-good" : "text-bad",
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

const SENTIMENT = {
  positive: { label: "Positive", Icon: Smile, cls: "bg-good-wash text-good" },
  neutral: { label: "Neutral", Icon: Meh, cls: "bg-surface-2 text-ink-2" },
  negative: { label: "Negative", Icon: Frown, cls: "bg-bad-wash text-bad" },
} as const;

export function SentimentBadge({
  sentiment,
  compact,
}: {
  sentiment: Sentiment | null;
  compact?: boolean;
}) {
  if (!sentiment) return <span className="text-ink-3">—</span>;
  const { label, Icon, cls } = SENTIMENT[sentiment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        cls,
      )}
    >
      <Icon size={compact ? 12 : 13} aria-hidden />
      {label}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-surface px-1 font-mono text-[11px] text-ink-3 ring-1 ring-line-strong">
      {children}
    </kbd>
  );
}
