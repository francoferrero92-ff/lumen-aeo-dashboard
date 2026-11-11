"use client";

import { ArrowDown, ArrowUp, ChevronRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ENGINES,
  TOPICS,
  promptMetrics,
  type EngineFilter,
  type Prompt,
  type Topic,
} from "@/lib/data";
import { cn, formatCompact, formatPercent, formatPts } from "@/lib/format";
import { Delta, Kbd, SentimentBadge } from "@/components/ui/Indicators";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type SortKey = "prompt" | "volume" | "visibility" | "delta" | "position";
type Density = "comfortable" | "compact";

interface Row {
  prompt: Prompt;
  m: ReturnType<typeof promptMetrics>;
}

/** Divider + soft shadow on the sticky column, only once the table is scrolled sideways. */
const STICKY_EDGE =
  "after:pointer-events-none after:absolute after:inset-y-0 after:-right-px after:w-px after:bg-line-strong after:opacity-0 after:transition-opacity group-data-[scrolled=true]/scroll:after:opacity-100 group-data-[scrolled=true]/scroll:shadow-[8px_0_12px_-8px_rgba(0,0,0,0.22)]";

const COLUMNS: { key: SortKey; label: string; align?: "right"; className?: string }[] = [
  { key: "prompt", label: "Prompt", className: "w-[38%] min-w-40 max-sm:max-w-44 sm:min-w-64" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "visibility", label: "Visibility", className: "min-w-40" },
  { key: "delta", label: "Change", align: "right" },
  { key: "position", label: "Avg. pos.", align: "right" },
];

export function PromptsTable({
  prompts,
  engine,
  onOpen,
}: {
  prompts: Prompt[];
  engine: EngineFilter;
  onOpen: (prompt: Prompt) => void;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "volume",
    dir: "desc",
  });
  const [density, setDensity] = useState<Density>("comfortable");
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, like most data tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = prompts
      .filter((p) => (!topic || p.topic === topic) && (!q || p.text.toLowerCase().includes(q)))
      .map((prompt) => ({ prompt, m: promptMetrics(prompt, engine) }));

    const value = (r: Row): number | string => {
      switch (sort.key) {
        case "prompt":
          return r.prompt.text;
        case "volume":
          return r.prompt.volume;
        case "visibility":
          return r.m.visibility;
        case "delta":
          return r.m.delta;
        case "position":
          // Not mentioned sorts last regardless of direction.
          return r.m.position ?? (sort.dir === "asc" ? Infinity : -Infinity);
      }
    };
    return filtered.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [prompts, engine, query, topic, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "prompt" || key === "position" ? "asc" : "desc" },
    );

  const cellY = density === "compact" ? "py-1.5" : "py-3";
  const filterKey = `${engine}-${topic}-${query}`;

  return (
    <section
      id="prompts"
      aria-labelledby="prompts-title"
      className="scroll-mt-6 rounded-lg bg-surface ring-1 ring-line"
    >
      <header className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="prompts-title" className="text-[15px] font-semibold">
            Tracked prompts
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Rolling 30-day window · click a prompt to see the answers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative flex h-8 flex-1 items-center sm:w-64 sm:flex-none">
            <span className="sr-only">Search prompts</span>
            <Search size={14} className="absolute left-2.5 text-ink-3" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
              placeholder="Search prompts"
              className="h-full w-full rounded-md bg-surface-2 pr-8 pl-8 text-[13px] text-ink ring-1 ring-line outline-none placeholder:text-ink-3 focus:bg-surface focus:ring-2 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 grid size-5 place-items-center rounded text-ink-3 hover:text-ink"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-1.5 hidden sm:block">
                <Kbd>/</Kbd>
              </span>
            )}
          </label>
          <SegmentedControl
            label="Row density"
            size="sm"
            value={density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "Comfy" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </div>
      </header>

      {/* Topic pills */}
      <div
        className="flex gap-1.5 overflow-x-auto border-b border-line px-4 py-2.5 [scrollbar-width:none]"
        role="group"
        aria-label="Filter by topic"
      >
        {[null, ...TOPICS].map((t) => {
          const selected = topic === t;
          const count = t ? prompts.filter((p) => p.topic === t).length : prompts.length;
          return (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={selected}
              onClick={() => setTopic(t)}
              className={cn(
                "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                selected
                  ? "bg-ink text-bg"
                  : "bg-surface-2 text-ink-2 ring-1 ring-line hover:text-ink",
              )}
            >
              {t ?? "All topics"}
              <span className={cn("tabular-nums", selected ? "opacity-70" : "text-ink-3")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="group/scroll relative overflow-x-auto overscroll-x-contain"
        data-scrolled={scrolled}
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 2)}
      >
        <table className="w-full min-w-[780px] border-separate border-spacing-0 text-[13px]">
          <caption className="sr-only">
            Tracked prompts with Halcyon visibility, change, position, sentiment and engine coverage
          </caption>
          <thead>
            <tr className="text-left text-xs text-ink-3">
              {COLUMNS.map((c, i) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={cn(
                      "border-b border-line px-4 py-2 font-medium",
                      i === 0 && cn("sticky left-0 z-10 bg-surface max-sm:pl-3", STICKY_EDGE),
                      c.className,
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        "group inline-flex items-center gap-1 rounded transition-colors hover:text-ink",
                        c.align === "right" && "w-full justify-end",
                        active && "text-ink",
                      )}
                    >
                      {c.label}
                      <span
                        className={cn(
                          "transition-opacity",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                        )}
                        aria-hidden
                      >
                        {active && sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="border-b border-line px-4 py-2 font-medium">
                Sentiment
              </th>
              <th scope="col" className="border-b border-line px-4 py-2 font-medium">
                Engines
              </th>
              <th scope="col" className="w-8 border-b border-line">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody key={filterKey}>
            {rows.map(({ prompt, m }, i) => (
              <tr
                key={prompt.id}
                onClick={() => onOpen(prompt)}
                className="row-in group cursor-pointer"
                style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
              >
                <td
                  className={cn(
                    "sticky left-0 z-10 border-b border-line bg-surface px-4 transition-[background-color,box-shadow] group-hover:bg-surface-2 max-sm:pl-3",
                    STICKY_EDGE,
                    cellY,
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(prompt);
                    }}
                    className="text-left font-medium text-ink outline-offset-2 after:absolute after:inset-0 focus-visible:outline-2"
                  >
                    {prompt.text}
                  </button>
                  {density === "comfortable" && (
                    <span className="mt-0.5 block text-xs text-ink-3">{prompt.topic}</span>
                  )}
                </td>
                <Td className={cn("text-right text-ink-2", cellY)}>{formatCompact(prompt.volume)}</Td>
                <Td className={cellY}>
                  <span className="flex items-center gap-2.5">
                    <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-accent-wash">
                      <span
                        className="series-mark absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500 ease-out-quart"
                        style={{ width: formatPercent(m.visibility, 1) }}
                      />
                    </span>
                    <span className="font-medium text-ink tabular-nums">
                      {formatPercent(m.visibility)}
                    </span>
                  </span>
                </Td>
                <Td className={cn("text-right", cellY)}>
                  <Delta value={m.delta * 100} label={formatPts(m.delta * 100, 0)} threshold={0.5} className="justify-end text-xs" />
                </Td>
                <Td className={cn("text-right tabular-nums", cellY)}>
                  {m.position ? (
                    <span className="text-ink">#{m.position.toFixed(1)}</span>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </Td>
                <Td className={cellY}>
                  <SentimentBadge sentiment={m.sentiment} compact={density === "compact"} />
                </Td>
                <Td className={cellY}>
                  <EngineDots prompt={prompt} engine={engine} />
                </Td>
                <Td className={cn("pr-3 text-ink-3", cellY)}>
                  <ChevronRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-ink">No prompts match</p>
            <p className="mt-1 text-xs text-ink-3">Try another topic or clear the search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setTopic(null);
              }}
              className="mt-3 h-7 rounded-md bg-surface-2 px-3 text-xs font-medium ring-1 ring-line hover:bg-surface-3"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      <p className="px-4 py-3 text-xs text-ink-3" aria-live="polite">
        {rows.length} of {prompts.length} prompts
      </p>
    </section>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-line px-4 transition-colors group-hover:bg-surface-2", className)}>
      {children}
    </td>
  );
}

/** One dot per engine: filled = mentioned, ring = not. Label carries meaning for AT. */
function EngineDots({ prompt, engine }: { prompt: Prompt; engine: EngineFilter }) {
  const mentioned = prompt.results.filter((r) => r.mentioned).map((r) => r.engine);
  const label = `Mentioned in ${mentioned.length} of ${ENGINES.length} engines: ${
    ENGINES.filter((e) => mentioned.includes(e.id))
      .map((e) => e.name)
      .join(", ") || "none"
  }`;
  return (
    <span className="flex items-center gap-1" role="img" aria-label={label} title={label}>
      {ENGINES.map((e) => {
        const on = mentioned.includes(e.id);
        const focused = engine === "all" || engine === e.id;
        return (
          <span
            key={e.id}
            className={cn(
              "size-2.5 rounded-full transition-opacity",
              on ? "bg-ink-2" : "ring-[1.5px] ring-axis ring-inset",
              !focused && "opacity-30",
            )}
          />
        );
      })}
    </span>
  );
}
