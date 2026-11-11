import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function KpiCard({
  label,
  value,
  unit,
  footer,
  aside,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  footer?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col justify-between gap-3 rounded-lg bg-surface p-4 ring-1 ring-line",
        className,
      )}
    >
      <h3 className="text-[13px] text-ink-2">{label}</h3>
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl sm:text-[28px] leading-none font-semibold tracking-[-0.02em] text-ink">
          {value}
          {unit && <span className="ml-0.5 text-lg font-medium text-ink-3">{unit}</span>}
        </p>
        {aside && <div className="hidden sm:block">{aside}</div>}
      </div>
      {footer && <div className="text-xs text-ink-3">{footer}</div>}
    </section>
  );
}
