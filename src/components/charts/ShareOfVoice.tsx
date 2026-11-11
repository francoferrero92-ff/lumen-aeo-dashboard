"use client";

import { useState } from "react";
import { cn, formatPercent, formatPts } from "@/lib/format";

export interface ShareItem {
  id: string;
  name: string;
  color: string;
  share: number;
  delta: number;
  own?: boolean;
}

/**
 * Horizontal bars: ≤24px thick, 4px rounded data-end, square at the baseline,
 * value at the tip. The whole row is the hover/focus target.
 */
export function ShareOfVoice({ items }: { items: ShareItem[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...items.map((i) => i.share));

  return (
    <ul className="space-y-1" aria-label="Share of voice by brand">
      {items.map((item) => {
        const pct = (item.share / max) * 100;
        const dim = hover !== null && hover !== item.id;
        return (
          <li
            key={item.id}
            tabIndex={0}
            onPointerEnter={() => setHover(item.id)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(item.id)}
            onBlur={() => setHover(null)}
            aria-label={`${item.name}: ${formatPercent(item.share, 1)} share of voice, ${formatPts(item.delta * 100)} vs previous period`}
            className="group grid grid-cols-[76px_1fr] items-center gap-3 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
          >
            <span
              className={cn(
                "truncate text-[13px]",
                item.own ? "font-semibold text-ink" : "text-ink-2",
              )}
            >
              {item.name}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="relative h-5 min-w-0 flex-1">
                <span
                  className={cn(
                    "series-mark absolute inset-y-0 left-0 rounded-r-[4px] transition-[width,opacity] duration-500 ease-out-quart",
                    dim && "opacity-40",
                  )}
                  style={{ width: `${pct}%`, background: item.color }}
                />
              </span>
              <span className="w-[86px] shrink-0 text-right text-xs tabular-nums">
                <span className="font-semibold text-ink">{formatPercent(item.share, 1)}</span>
                <span
                  className={cn(
                    "ml-1.5",
                    Math.abs(item.delta) < 0.0005
                      ? "text-ink-3"
                      : item.delta > 0
                        ? "text-good"
                        : "text-bad",
                  )}
                >
                  {item.delta > 0 ? "▲" : item.delta < 0 ? "▼" : ""}
                  {Math.abs(item.delta * 100).toFixed(1)}
                </span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
