"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatDay, formatLongDay } from "@/lib/format";

export interface LineSeries {
  id: string;
  name: string;
  color: string;
  values: number[];
  /** Draws a 10% area wash under the line (use for the one series the story is about). */
  emphasis?: boolean;
}

interface Props {
  dates: Date[];
  series: LineSeries[];
  annotation?: { index: number; label: string };
  formatValue?: (v: number) => string;
  height?: number;
  ariaLabel: string;
}

const M = { top: 16, right: 92, bottom: 28, left: 36 };
const NARROW = 440;

function niceMax(v: number) {
  const step = v > 60 ? 20 : 10;
  return Math.ceil(v / step) * step;
}

export function LineChart({
  dates,
  series,
  annotation,
  formatValue = (v) => `${v.toFixed(1)}%`,
  height = 272,
  ariaLabel,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < NARROW;
  const margin = { ...M, right: narrow ? 12 : M.right };
  const innerW = Math.max(10, width - margin.left - margin.right);
  const innerH = height - margin.top - margin.bottom;
  const n = dates.length;

  const yMax = useMemo(
    () => niceMax(Math.max(...series.flatMap((s) => s.values)) * 1.08),
    [series],
  );
  const yStep = yMax > 60 ? 20 : 10;
  const yTicks = Array.from({ length: yMax / yStep + 1 }, (_, i) => i * yStep);

  const x = (i: number) => margin.left + (i / (n - 1)) * innerW;
  const y = (v: number) => margin.top + (1 - v / yMax) * innerH;

  const xTickCount = narrow ? 3 : 5;
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / (xTickCount - 1)) * (n - 1)),
  );

  const linePath = (values: number[]) =>
    values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const areaPath = (values: number[]) =>
    `${linePath(values)}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;

  // End labels: sort by value, push apart to avoid overlap, draw leaders.
  const endLabels = useMemo(() => {
    const minGap = 17;
    const items = series
      .map((s) => ({ s, target: y(s.values[n - 1]), pos: y(s.values[n - 1]) }))
      .sort((a, b) => a.target - b.target);
    for (let i = 1; i < items.length; i++) {
      if (items[i].pos - items[i - 1].pos < minGap) items[i].pos = items[i - 1].pos + minGap;
    }
    const overflow = items.length ? items[items.length - 1].pos - (margin.top + innerH) : 0;
    if (overflow > 0) items.forEach((it) => (it.pos -= overflow));
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, width, yMax]);

  const indexFromX = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const px = clientX - rect.left - margin.left;
    return Math.max(0, Math.min(n - 1, Math.round((px / innerW) * (n - 1))));
  };

  const tooltipRows =
    active === null
      ? []
      : [...series].sort((a, b) => b.values[active] - a.values[active]);
  const tooltipLeft = active === null ? 0 : x(active);
  const flip = tooltipLeft > width - 200;

  return (
    <div ref={wrapRef} className="relative select-none">
      <div
        role="group"
        aria-label={ariaLabel}
        aria-describedby={active !== null ? tooltipId : undefined}
        tabIndex={0}
        className="rounded-md outline-offset-4"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const step = e.shiftKey ? 7 : 1;
            setActive((a) => {
              const start = a ?? n - 1;
              return Math.max(0, Math.min(n - 1, start + (e.key === "ArrowRight" ? step : -step)));
            });
          } else if (e.key === "Home") setActive(0);
          else if (e.key === "End") setActive(n - 1);
          else if (e.key === "Escape") setActive(null);
        }}
        onFocus={() => setActive((a) => a ?? n - 1)}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={height}
          className="block touch-pan-y"
          onPointerMove={(e) => setActive(indexFromX(e.clientX))}
          onPointerDown={(e) => setActive(indexFromX(e.clientX))}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        >
          {/* Grid + y ticks */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={margin.left}
                x2={margin.left + innerW}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? "var(--axis)" : "var(--grid)"}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={margin.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-3 text-[11px] tabular-nums"
              >
                {t}%
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTicks.map((i, k) => (
            <text
              key={i}
              x={x(i)}
              y={height - 8}
              textAnchor={k === 0 ? "start" : k === xTicks.length - 1 ? "end" : "middle"}
              className="fill-ink-3 text-[11px] tabular-nums"
            >
              {formatDay(dates[i])}
            </text>
          ))}

          {/* Annotation */}
          {annotation && annotation.index >= 0 && annotation.index < n && (
            <g aria-hidden>
              <line
                x1={x(annotation.index)}
                x2={x(annotation.index)}
                y1={margin.top}
                y2={margin.top + innerH}
                stroke="var(--line-strong)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <rect
                x={x(annotation.index) - 3.5}
                y={margin.top - 3.5}
                width={7}
                height={7}
                rx={1.5}
                transform={`rotate(45 ${x(annotation.index)} ${margin.top})`}
                fill="var(--ink-2)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
              <text
                // Flip the label to the left of the marker when it would run off the edge.
                x={x(annotation.index) + (x(annotation.index) + 170 > width ? -8 : 8)}
                textAnchor={x(annotation.index) + 170 > width ? "end" : "start"}
                y={margin.top}
                dy="0.32em"
                className="fill-ink-2 text-[11px] font-medium"
              >
                {annotation.label}
              </text>
            </g>
          )}

          {/* Area wash for the emphasized series */}
          {series
            .filter((s) => s.emphasis)
            .map((s) => (
              <path
                key={`${s.id}-area`}
                d={areaPath(s.values)}
                fill={s.color}
                opacity={0.1}
                className="series-mark"
              />
            ))}

          {/* Lines: draw the emphasized one last so it sits on top */}
          {[...series]
            .sort((a, b) => Number(!!a.emphasis) - Number(!!b.emphasis))
            .map((s) => (
              <path
                key={s.id}
                d={linePath(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="series-mark transition-[d] duration-500 ease-out-quart"
              />
            ))}

          {/* End dots + direct labels (with leader lines when nudged) */}
          {endLabels.map(({ s, target, pos }) => (
            <g key={`${s.id}-end`}>
              <circle
                cx={x(n - 1)}
                cy={target}
                r={4}
                fill={s.color}
                stroke="var(--surface)"
                strokeWidth={2}
                className="series-mark"
              />
              {!narrow && (
                <>
                  {Math.abs(pos - target) > 2 && (
                    <path
                      d={`M${x(n - 1) + 6},${target}L${x(n - 1) + 12},${pos}`}
                      stroke="var(--axis)"
                      fill="none"
                    />
                  )}
                  <text x={x(n - 1) + 14} y={pos} dy="0.32em" className="text-[11px]">
                    <tspan className="fill-ink font-semibold tabular-nums">
                      {formatValue(s.values[n - 1])}
                    </tspan>
                    <tspan className="fill-ink-3" dx={5}>
                      {s.name}
                    </tspan>
                  </text>
                </>
              )}
            </g>
          ))}

          {/* Crosshair */}
          {active !== null && (
            <g aria-hidden>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={margin.top}
                y2={margin.top + innerH}
                stroke="var(--ink-3)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              {series.map((s) => (
                <circle
                  key={s.id}
                  cx={x(active)}
                  cy={y(s.values[active])}
                  r={4}
                  fill={s.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  className="series-mark"
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip: values lead, names follow; line keys instead of boxes */}
      {active !== null && (
        <div
          id={tooltipId}
          role="status"
          className="pointer-events-none absolute top-2 z-20 min-w-44 rounded-md bg-surface px-3 py-2.5 shadow-pop ring-1 ring-line"
          style={{
            left: tooltipLeft,
            transform: flip ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
        >
          <p className="mb-1.5 text-[11px] font-medium text-ink-3">
            {formatLongDay(dates[active])}
          </p>
          <ul className="space-y-1">
            {tooltipRows.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden
                  className="series-mark h-0.5 w-3 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="font-semibold text-ink tabular-nums">
                  {formatValue(s.values[active])}
                </span>
                <span className="text-ink-3">{s.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
