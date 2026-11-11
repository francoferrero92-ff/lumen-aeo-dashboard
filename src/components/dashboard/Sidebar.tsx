import {
  BarChart3,
  Bot,
  ChevronsUpDown,
  FileText,
  LayoutGrid,
  Link2,
  MessageSquareText,
  Settings,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/format";

export function LumenMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="7" fill="var(--ink)" />
      <path d="M6 15.5a6 6 0 0 1 12 0" fill="none" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="2" fill="var(--accent)" />
    </svg>
  );
}

const NAV = [
  { label: "Overview", icon: LayoutGrid, href: "#overview", active: true },
  { label: "Prompts", icon: MessageSquareText, href: "#prompts" },
  { label: "Competitors", icon: Swords, href: "#share-of-voice" },
  { label: "Citations", icon: Link2, soon: true },
  { label: "Content", icon: FileText, soon: true },
  { label: "Agents", icon: Bot, soon: true },
  { label: "Reports", icon: BarChart3, soon: true },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg px-3 py-4 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <LumenMark />
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Lumen</span>
      </div>

      <button
        type="button"
        className="mt-5 flex items-center gap-2.5 rounded-md bg-surface px-2.5 py-2 text-left ring-1 ring-line transition-colors hover:bg-surface-2"
        aria-label="Workspace: Halcyon Running (demo)"
      >
        <span className="grid size-6 place-items-center rounded-[6px] bg-series-1 text-[11px] font-semibold text-white">
          H
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">Halcyon Running</span>
          <span className="block text-[11px] text-ink-3">Demo workspace</span>
        </span>
        <ChevronsUpDown size={14} className="text-ink-3" aria-hidden />
      </button>

      <nav aria-label="Main" className="mt-5">
        <ul className="space-y-0.5">
          {NAV.map(({ label, icon: Icon, href, active, soon }) => (
            <li key={label}>
              {soon ? (
                <span
                  aria-disabled
                  className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-ink-3"
                >
                  <Icon size={16} aria-hidden />
                  {label}
                  <span className="ml-auto rounded-[4px] px-1 text-[10px] font-medium tracking-wide text-ink-3 uppercase ring-1 ring-line-strong">
                    Soon
                  </span>
                </span>
              ) : (
                <a
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                    active
                      ? "bg-surface font-medium text-ink ring-1 ring-line"
                      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon size={16} aria-hidden />
                  {label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-md bg-surface p-3 text-xs leading-relaxed text-ink-2 ring-1 ring-line">
          <p className="font-medium text-ink">Design engineering demo</p>
          <p className="mt-1">Fictional brands and data. Built with Next.js, TypeScript and Tailwind.</p>
        </div>
        <span className="flex h-8 items-center gap-2.5 px-2.5 text-[13px] text-ink-3">
          <Settings size={16} aria-hidden />
          Settings
        </span>
      </div>
    </aside>
  );
}
