"use client";

import { Table2, LineChart as LineIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BRANDS,
  DATES,
  ENGINES,
  LAUNCH_DAYS_AGO,
  OWN_BRAND,
  PROMPTS,
  mean,
  promptMetrics,
  visibilitySeries,
  windows,
  type EngineFilter,
  type Prompt,
  type RangeDays,
} from "@/lib/data";
import { cn, formatDay, formatPercent, formatPts } from "@/lib/format";
import { useHideOnScroll } from "@/lib/useHideOnScroll";
import { LineChart } from "@/components/charts/LineChart";
import { ShareOfVoice } from "@/components/charts/ShareOfVoice";
import { Sparkline } from "@/components/charts/Sparkline";
import { Delta } from "@/components/ui/Indicators";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { KpiCard } from "./KpiCard";
import { PromptDrawer } from "./PromptDrawer";
import { PromptsTable } from "./PromptsTable";
import { LumenMark } from "./Sidebar";

const color = (slot: number) => `var(--series-${slot})`;

const RANGE_OPTIONS: { value: "30" | "90"; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];
const ENGINE_OPTIONS: { value: EngineFilter; label: string }[] = [
  { value: "all", label: "All engines" },
  ...ENGINES.map((e) => ({ value: e.id, label: e.name })),
];

export function Dashboard() {
  const [range, setRange] = useState<RangeDays>(90);
  const [engine, setEngine] = useState<EngineFilter>("all");
  const [open, setOpen] = useState<Prompt | null>(null);
  const [chartView, setChartView] = useState<"chart" | "table">("chart");
  const filtersHidden = useHideOnScroll();

  const data = useMemo(() => {
    const byBrand = BRANDS.map((b) => {
      const full = visibilitySeries(b.id, engine);
      const { current, previous } = windows(full, range);
      return { brand: b, full, current, avg: mean(current), prevAvg: mean(previous) };
    });
    const total = byBrand.reduce((s, b) => s + b.avg, 0);
    const prevTotal = byBrand.reduce((s, b) => s + b.prevAvg, 0);
    const share = byBrand.map((b) => ({
      ...b,
      share: b.avg / total,
      prevShare: b.prevAvg / prevTotal,
    }));
    const own = share.find((b) => b.brand.own)!;

    // Weekly share of voice for the sparkline (current + previous window).
    const ownShareDaily = DATES.map((_, i) => {
      const sum = byBrand.reduce((s, b) => s + b.full[i], 0);
      return own.full[i] / sum;
    }).slice(-range * 2);

    const metrics = PROMPTS.map((p) => promptMetrics(p, engine));
    const positions = metrics.flatMap((m) => (m.position ? [m.position] : []));
    const answers = PROMPTS.flatMap((p) =>
      p.results.filter((r) => engine === "all" || r.engine === engine),
    );
    const mentions = answers.filter((r) => r.mentioned);
    const sentiment = {
      positive: mentions.filter((r) => r.sentiment === "positive").length,
      neutral: mentions.filter((r) => r.sentiment === "neutral").length,
      negative: mentions.filter((r) => r.sentiment === "negative").length,
    };

    return { byBrand: share, own, ownShareDaily, positions, mentions, answers, sentiment };
  }, [engine, range]);

  const dates = DATES.slice(-range);
  const launchIndex = range - 1 - LAUNCH_DAYS_AGO;
  const engineName = engine === "all" ? "all engines" : ENGINES.find((e) => e.id === engine)!.name;
  const { own, sentiment, mentions } = data;
  const posShare = mentions.length ? sentiment.positive / mentions.length : 0;

  return (
    <main id="overview" className="min-w-0 flex-1 px-4 pt-4 pb-16 sm:px-6 lg:px-8 lg:pt-7">
      {/* Mobile top bar */}
      <div className="mb-5 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <LumenMark />
          <span className="text-[15px] font-semibold">Lumen</span>
        </div>
        <ThemeToggle />
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-3">Halcyon Running · AI visibility</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Overview</h1>
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </header>

      {/*
        Filters: one row, above everything they scope. Date range first.
        Phones get two native selects side by side (no horizontal scroll), and
        the bar slides away while scrolling down, returning on scroll up.
      */}
      <div
        className={cn(
          "sticky top-0 z-30 -mx-4 mt-5 bg-bg/85 px-4 py-2.5 backdrop-blur-md transition-transform duration-300 ease-out-quart sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
          filtersHidden && "max-sm:-translate-y-full",
        )}
      >
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] gap-2 sm:hidden">
          <Select
            label="Date range"
            value={String(range) as "30" | "90"}
            onChange={(v) => setRange(Number(v) as RangeDays)}
            options={RANGE_OPTIONS}
          />
          <Select label="AI engine" value={engine} onChange={setEngine} options={ENGINE_OPTIONS} />
        </div>
        <div className="hidden gap-2 sm:flex">
          <SegmentedControl
            label="Date range"
            value={String(range) as "30" | "90"}
            onChange={(v) => setRange(Number(v) as RangeDays)}
            options={RANGE_OPTIONS}
          />
          <SegmentedControl label="AI engine" value={engine} onChange={setEngine} options={ENGINE_OPTIONS} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard
          label="Visibility score"
          value={own.avg.toFixed(1)}
          unit="%"
          aside={<Sparkline values={visibilitySeries(OWN_BRAND.id, engine).slice(-range * 2)} highlightLast={range} />}
          footer={
            <>
              <Delta value={own.avg - own.prevAvg} label={formatPts(own.avg - own.prevAvg)} />{" "}
              vs previous {range} days
            </>
          }
        />
        <KpiCard
          label="Share of voice"
          value={(own.share * 100).toFixed(1)}
          unit="%"
          aside={<Sparkline values={data.ownShareDaily} highlightLast={range} />}
          footer={
            <>
              <Delta
                value={(own.share - own.prevShare) * 100}
                label={formatPts((own.share - own.prevShare) * 100)}
              />{" "}
              vs 3 tracked competitors
            </>
          }
        />
        <KpiCard
          label="Avg. position when mentioned"
          value={data.positions.length ? `#${mean(data.positions).toFixed(1)}` : "—"}
          footer={`Across ${mentions.length} of ${data.answers.length} answers · 1 = recommended first`}
        />
        <KpiCard
          label="Positive sentiment"
          value={(posShare * 100).toFixed(0)}
          unit="%"
          footer={<SentimentBar {...sentiment} />}
        />
      </div>

      {/* Chart + share of voice */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <section
          aria-labelledby="trend-title"
          className="min-w-0 rounded-lg bg-surface p-4 ring-1 ring-line xl:col-span-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="trend-title" className="text-[15px] font-semibold">
                Visibility over time
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-3">
                % of tracked prompts where each brand appears · {engineName}
              </p>
            </div>
            <SegmentedControl
              label="Chart view"
              size="sm"
              value={chartView}
              onChange={setChartView}
              options={[
                { value: "chart", label: <LineIcon size={14} />, ariaLabel: "Chart" },
                { value: "table", label: <Table2 size={14} />, ariaLabel: "Table" },
              ]}
            />
          </div>

          {/* Legend: always present for ≥2 series; marks mirror the line form */}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
            {BRANDS.map((b) => (
              <li key={b.id} className="flex items-center gap-1.5 text-xs text-ink-2">
                <span
                  aria-hidden
                  className="series-mark h-0.5 w-3.5 rounded-full"
                  style={{ background: color(b.slot) }}
                />
                {b.name}
                {b.own && <span className="text-ink-3">(you)</span>}
              </li>
            ))}
          </ul>

          <div className="mt-2">
            {chartView === "chart" ? (
              <LineChart
                ariaLabel={`Visibility over the last ${range} days for Halcyon and competitors on ${engineName}. Use left and right arrow keys to read values.`}
                dates={dates}
                annotation={launchIndex >= 0 ? { index: launchIndex, label: "Buying guides published" } : undefined}
                series={data.byBrand.map((b) => ({
                  id: b.brand.id,
                  name: b.brand.name,
                  color: color(b.brand.slot),
                  values: b.current,
                  emphasis: b.brand.own,
                }))}
              />
            ) : (
              <WeeklyTable dates={dates} series={data.byBrand.map((b) => ({ name: b.brand.name, values: b.current }))} />
            )}
          </div>
        </section>

        <section
          id="share-of-voice"
          aria-labelledby="sov-title"
          className="scroll-mt-20 rounded-lg bg-surface p-4 ring-1 ring-line"
        >
          <h2 id="sov-title" className="text-[15px] font-semibold">
            Share of voice
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Mentions vs competitors · change in pts
          </p>
          <div className="mt-4">
            <ShareOfVoice
              items={[...data.byBrand]
                .sort((a, b) => b.share - a.share)
                .map((b) => ({
                  id: b.brand.id,
                  name: b.brand.name,
                  color: color(b.brand.slot),
                  share: b.share,
                  delta: b.share - b.prevShare,
                  own: b.brand.own,
                }))}
            />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-3">
            Halcyon gained the most share since the buying guides went live on{" "}
            {formatDay(DATES[DATES.length - 1 - LAUNCH_DAYS_AGO])}, mostly at Strata’s expense.
          </p>
        </section>
      </div>

      <div className="mt-3">
        <PromptsTable prompts={PROMPTS} engine={engine} onOpen={setOpen} />
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <p>Demo with fictional brands and generated data.</p>
        <p>
          Designed & built by{" "}
          <a
            href="https://francoferrero-portfolio.vercel.app/"
            className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink"
          >
            Franco Ferrero
          </a>
        </p>
      </footer>

      <PromptDrawer prompt={open} engine={engine} onClose={() => setOpen(null)} />
    </main>
  );
}

function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = positive + neutral + negative || 1;
  const parts = [
    { key: "Positive", n: positive, cls: "bg-good" },
    { key: "Neutral", n: neutral, cls: "bg-axis" },
    { key: "Negative", n: negative, cls: "bg-bad" },
  ];
  return (
    <div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {parts.map((p) => (
          <span key={p.key} className={`series-mark ${p.cls}`} style={{ width: `${(p.n / total) * 100}%` }} />
        ))}
      </div>
      <p className="mt-2 tabular-nums">
        {parts.map((p, i) => (
          <span key={p.key}>
            {i > 0 && " · "}
            {p.key} {p.n}
          </span>
        ))}
      </p>
    </div>
  );
}

/** Table view of the chart: weekly averages, so no value is gated behind hover. */
function WeeklyTable({ dates, series }: { dates: Date[]; series: { name: string; values: number[] }[] }) {
  const weeks: { start: Date; idx: [number, number] }[] = [];
  for (let end = dates.length; end > 0; end -= 7) {
    const start = Math.max(0, end - 7);
    weeks.unshift({ start: dates[start], idx: [start, end] });
  }
  return (
    <div className="max-h-[272px] overflow-auto rounded-md ring-1 ring-line">
      <table className="w-full text-[13px] tabular-nums">
        <caption className="sr-only">Weekly average visibility by brand</caption>
        <thead className="sticky top-0 bg-surface-2 text-xs text-ink-3">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Week of</th>
            {series.map((s) => (
              <th key={s.name} scope="col" className="px-3 py-2 text-right font-medium">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.start.toISOString()} className="border-t border-line">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-ink-2">
                {formatDay(w.start)}
              </th>
              {series.map((s) => (
                <td key={s.name} className="px-3 py-1.5 text-right">
                  {formatPercent(mean(s.values.slice(...w.idx)) / 100, 1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
