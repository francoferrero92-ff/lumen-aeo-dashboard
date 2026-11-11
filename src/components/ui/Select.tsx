"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/format";

interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

/**
 * Compact filter for small screens. A styled native <select>: on phones it
 * opens the OS picker, which beats any custom dropdown for thumb reach and
 * accessibility.
 */
export function Select<T extends string>({ label, value, onChange, options, className }: Props<T>) {
  return (
    <label
      className={cn(
        "relative flex h-9 min-w-0 items-center rounded-[9px] bg-surface ring-1 ring-line transition-shadow focus-within:ring-2 focus-within:ring-accent",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full w-full min-w-0 cursor-pointer appearance-none truncate rounded-[9px] bg-transparent pr-8 pl-3 text-[13px] font-medium text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-ink-3" aria-hidden />
    </label>
  );
}
