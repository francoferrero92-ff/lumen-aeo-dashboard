"use client";

import { ExternalLink, Lightbulb, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  BRANDS,
  ENGINES,
  OWN_BRAND,
  promptMetrics,
  type EngineFilter,
  type EngineId,
  type Prompt,
} from "@/lib/data";
import { cn, formatCompact, formatPercent, formatPts } from "@/lib/format";
import { Delta, SentimentBadge } from "@/components/ui/Indicators";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

/**
 * Prompt detail in a native <dialog>: focus is trapped and restored by the
 * browser, Esc closes it, and the rest of the page becomes inert.
 */
export function PromptDrawer({
  prompt,
  engine: engineFilter,
  onClose,
}: {
  prompt: Prompt | null;
  engine: EngineFilter;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Keep the last prompt rendered while the exit transition plays.
  const [shown, setShown] = useState<Prompt | null>(prompt);
  const [engine, setEngine] = useState<EngineId>("chatgpt");
  const [prev, setPrev] = useState<Prompt | null>(prompt);

  // Sync derived state during render when a new prompt opens (no effect needed).
  if (prompt !== prev) {
    setPrev(prompt);
    if (prompt) {
      setShown(prompt);
      setEngine(engineFilter === "all" ? firstMentioned(prompt) : engineFilter);
    }
  }

  // The effect only talks to the DOM: open/close the native dialog.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (prompt && !dialog.open) dialog.showModal();
    else if (!prompt && dialog.open) dialog.close();
  }, [prompt]);

  const result = shown?.results.find((r) => r.engine === engine);
  const overall = shown ? promptMetrics(shown, "all") : null;

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {shown && overall && result && (
        <div className="flex h-full flex-col">
          <header className="border-b border-line px-5 pt-4 pb-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2 ring-1 ring-line">
                {shown.topic}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <h2 id="drawer-title" className="mt-3 text-xl leading-snug font-semibold tracking-[-0.01em] text-balance">
              “{shown.text}”
            </h2>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <Stat label="Monthly volume" value={formatCompact(shown.volume)} />
              <Stat
                label="Visibility"
                value={formatPercent(overall.visibility)}
                extra={
                  <Delta
                    value={overall.delta * 100}
                    label={formatPts(overall.delta * 100, 0)}
                    threshold={0.5}
                    className="text-xs"
                  />
                }
              />
              <Stat
                label="Mentioned in"
                value={`${overall.mentionedIn}/${overall.total}`}
                extra={<span className="text-xs text-ink-3">engines</span>}
              />
            </dl>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              <SegmentedControl
                label="Engine"
                size="sm"
                value={engine}
                onChange={setEngine}
                options={ENGINES.map((e) => {
                  const r = shown.results.find((x) => x.engine === e.id)!;
                  return {
                    value: e.id,
                    label: (
                      <>
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 rounded-full",
                            r.mentioned ? "bg-good" : "ring-1 ring-axis",
                          )}
                        />
                        {e.name}
                      </>
                    ),
                    ariaLabel: `${e.name}${r.mentioned ? ", mentioned" : ", not mentioned"}`,
                  };
                })}
              />
            </div>

            <section key={engine} className="row-in mt-4" aria-label="Answer">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {result.mentioned ? (
                  <span className="rounded-full bg-accent-wash px-2 py-0.5 font-medium text-accent-ink">
                    Halcyon ranked #{result.position}
                  </span>
                ) : (
                  <span className="rounded-full bg-warn-wash px-2 py-0.5 font-medium text-warn">
                    Halcyon not mentioned
                  </span>
                )}
                <SentimentBadge sentiment={result.sentiment} />
                <span className="ml-auto text-ink-3 tabular-nums">
                  {formatPercent(result.visibility)} of runs ·{" "}
                  <Delta
                    value={(result.visibility - result.previousVisibility) * 100}
                    label={formatPts((result.visibility - result.previousVisibility) * 100, 0)}
                    threshold={0.5}
                  />
                </span>
              </div>

              <figure className="mt-3 rounded-lg bg-surface-2 p-4 ring-1 ring-line">
                <figcaption className="mb-2 text-[11px] font-medium tracking-wide text-ink-3 uppercase">
                  Latest answer · excerpt
                </figcaption>
                <blockquote className="text-[14px] leading-relaxed text-ink-2">
                  <Highlighted text={result.answer} />
                </blockquote>
              </figure>

              {result.competitors.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-medium text-ink-3">Also in this answer</h3>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {result.competitors.map((id) => {
                      const b = BRANDS.find((x) => x.id === id)!;
                      return (
                        <li
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-2 ring-1 ring-line"
                        >
                          <span
                            aria-hidden
                            className="series-mark size-2 rounded-full"
                            style={{ background: `var(--series-${b.slot})` }}
                          />
                          {b.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-5">
                <h3 className="text-xs font-medium text-ink-3">
                  Sources cited <span className="tabular-nums">({result.citations.length})</span>
                </h3>
                <ol className="mt-2 divide-y divide-line rounded-lg ring-1 ring-line">
                  {result.citations.map((c, i) => (
                    <li key={c.title} className="flex items-start gap-3 px-3 py-2.5">
                      <span className="mt-0.5 w-4 shrink-0 text-xs text-ink-3 tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{c.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                          {c.domain}
                          <ExternalLink size={11} aria-hidden />
                        </span>
                      </span>
                      {c.own && (
                        <span className="shrink-0 rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                          Your site
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <Suggestion
                mentioned={result.mentioned}
                ownCited={result.citations.some((c) => c.own)}
                engineName={ENGINES.find((e) => e.id === engine)!.name}
              />
            </section>
          </div>
        </div>
      )}
    </dialog>
  );
}

function firstMentioned(p: Prompt): EngineId {
  return (p.results.find((r) => r.mentioned) ?? p.results[0]).engine;
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-ink-3">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        {extra}
      </dd>
    </div>
  );
}

/** Marks the own brand; competitor names get weight but no color (text never wears series color). */
function Highlighted({ text }: { text: string }) {
  const names = BRANDS.map((b) => b.name);
  const parts = text.split(new RegExp(`(${names.join("|")})`, "g"));
  return (
    <>
      {parts.map((part, i) =>
        part === OWN_BRAND.name ? (
          <mark key={i} className="rounded-[3px] bg-accent-wash px-0.5 font-semibold text-ink">
            {part}
          </mark>
        ) : names.includes(part) ? (
          <strong key={i} className="font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Suggestion({
  mentioned,
  ownCited,
  engineName,
}: {
  mentioned: boolean;
  ownCited: boolean;
  engineName: string;
}) {
  const copy = !mentioned
    ? `${engineName} answers this prompt from third-party reviews only. A comparison page with lab data gives it a source to cite.`
    : !ownCited
      ? `You're mentioned, but ${engineName} isn't citing halcyon.run. Adding a structured FAQ to the product page can earn the citation.`
      : `${engineName} already cites your site here. Keep the page fresh: answers drift when sources go stale.`;
  return (
    <aside className="mt-5 flex gap-3 rounded-lg bg-accent-wash p-3.5">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent-ink" aria-hidden />
      <div>
        <p className="text-xs font-semibold text-accent-ink">Suggested next step</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{copy}</p>
      </div>
    </aside>
  );
}
