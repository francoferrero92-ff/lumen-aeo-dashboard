# Lumen — AI visibility dashboard

A design engineering demo by [Franco Ferrero](https://francoferrero-portfolio.vercel.app/).

Lumen answers one question for a brand: **how often do AI assistants recommend us, and why?** It tracks a set of prompts across ChatGPT, Perplexity, Gemini and Google AI Overviews, and shows visibility, share of voice against competitors, sentiment, and the sources each answer cites.

Brands, domains and data are fictional and generated from a fixed seed.

## Stack

- **Next.js 16** (App Router, static export)
- **TypeScript** (strict)
- **Tailwind CSS v4**, driven by a token layer in `globals.css`
- No UI kit and no chart library: components and charts are built from scratch

## What to look at

**Design tokens.** Raw values live in CSS custom properties, one block per theme. Tailwind's `@theme` maps them to utilities by role (`bg-surface`, `text-ink-2`, `ring-line`), so components never reference a hex value. Dark mode is its own set of values chosen for the dark surface, not an automatic inversion.

**Data visualization.**
- The line chart is hand-built SVG. It has a crosshair that snaps to the nearest day, one tooltip listing every series, direct end labels with leader lines when labels would collide, and an annotation for the content launch.
- The categorical palette was checked for color-vision deficiency separation in both themes.
- Color follows the brand, never its rank, so filtering never repaints a series.
- Every chart has a non-visual path: a legend, direct labels, and a table view of the same data.

**Accessibility.**
- The chart is keyboard-readable: arrow keys move the crosshair, Shift jumps a week.
- Segmented controls are real radio groups with roving tabindex.
- The prompt detail uses a native `<dialog>`, so focus trapping, Esc and focus return come from the browser.
- Status (sentiment, change) always pairs color with an icon and a label.
- Motion respects `prefers-reduced-motion`.

**Interaction details.**
- A sliding indicator on segmented controls.
- Table rows fade in when filters change.
- Sortable columns with `aria-sort`, and two row densities.
- `/` focuses search and Esc clears it.
- The drawer animates in and out with `@starting-style` and no animation library.
- The theme is applied before first paint, so it never flashes.

**Responsive.** The sidebar collapses on small screens, the KPIs reflow to two columns, and the table scrolls horizontally with a sticky first column.

## Structure

```
src/
  app/                 layout (fonts, theme script), page, tokens
  components/
    charts/            LineChart, ShareOfVoice, Sparkline
    dashboard/         Dashboard, PromptsTable, PromptDrawer, KpiCard, Sidebar
    ui/                SegmentedControl, ThemeToggle, Delta, SentimentBadge, Kbd
  lib/
    data.ts            seeded mock data + metric helpers
    format.ts          number/date formatting
```

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to /out
```

## Deploy

Import the repository in Vercel. No configuration or environment variables are needed.
