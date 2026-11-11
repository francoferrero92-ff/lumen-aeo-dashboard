/**
 * Mock data for the Lumen demo.
 *
 * Everything is generated from a fixed seed so the server render and the
 * client render always agree (no hydration mismatches) and screenshots are
 * reproducible. Brands, domains and prompts are fictional.
 */

export type EngineId = "chatgpt" | "perplexity" | "gemini" | "aio";
export type BrandId = "halcyon" | "strata" | "kinetik" | "arcfoot";
export type Sentiment = "positive" | "neutral" | "negative";

export interface Engine {
  id: EngineId;
  name: string;
}

export interface Brand {
  id: BrandId;
  name: string;
  /** Categorical slot (1–4). Color follows the entity, never its rank. */
  slot: 1 | 2 | 3 | 4;
  own?: boolean;
}

export interface Citation {
  domain: string;
  title: string;
  own?: boolean;
}

export interface EngineResult {
  engine: EngineId;
  mentioned: boolean;
  /** Rank of the brand inside the answer (1 = first recommended). */
  position: number | null;
  sentiment: Sentiment | null;
  /** Share of daily runs (last 30 days) in which the brand appeared. */
  visibility: number;
  /** Same metric for the previous 30 days. */
  previousVisibility: number;
  answer: string;
  competitors: BrandId[];
  citations: Citation[];
}

export interface Prompt {
  id: string;
  text: string;
  topic: Topic;
  /** Estimated monthly prompt volume across engines. */
  volume: number;
  results: EngineResult[];
}

export const TOPICS = [
  "Buying guides",
  "Comparisons",
  "Fit & injury",
  "Trail",
  "Sustainability",
] as const;
export type Topic = (typeof TOPICS)[number];

export const ENGINES: Engine[] = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "perplexity", name: "Perplexity" },
  { id: "gemini", name: "Gemini" },
  { id: "aio", name: "AI Overviews" },
];

export const BRANDS: Brand[] = [
  { id: "halcyon", name: "Halcyon", slot: 1, own: true },
  { id: "strata", name: "Strata", slot: 2 },
  { id: "kinetik", name: "Kinetik", slot: 3 },
  { id: "arcfoot", name: "Arcfoot", slot: 4 },
];

export const OWN_BRAND = BRANDS[0];

/** Last day of data. Fixed so every render is identical. */
export const END_DATE = new Date(Date.UTC(2026, 10, 10));
/** Total days generated (two 90-day windows, so 90d has a comparison period). */
const TOTAL_DAYS = 180;
/** Day index (from the end) when Halcyon published its buying guides. */
export const LAUNCH_DAYS_AGO = 38;

// ---------------------------------------------------------------------------
// Seeded RNG
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------------------
// Time series: daily visibility (% of tracked prompts mentioning the brand)
// ---------------------------------------------------------------------------

export const DATES: Date[] = Array.from({ length: TOTAL_DAYS }, (_, i) => {
  const d = new Date(END_DATE);
  d.setUTCDate(d.getUTCDate() - (TOTAL_DAYS - 1 - i));
  return d;
});

/** Baseline visibility per brand and engine, in %. */
const BASELINES: Record<BrandId, Record<EngineId, number>> = {
  halcyon: { chatgpt: 31, perplexity: 36, gemini: 24, aio: 28 },
  strata: { chatgpt: 41, perplexity: 33, gemini: 38, aio: 35 },
  kinetik: { chatgpt: 27, perplexity: 29, gemini: 31, aio: 22 },
  arcfoot: { chatgpt: 18, perplexity: 21, gemini: 16, aio: 20 },
};

/** Total lift Halcyon gains after its content launch, per engine (pts). */
const LAUNCH_LIFT: Record<EngineId, number> = {
  chatgpt: 13,
  perplexity: 17,
  gemini: 9,
  aio: 12,
};

function buildSeries(brand: BrandId, engine: EngineId): number[] {
  const rand = mulberry32(hash(`${brand}:${engine}`));
  const base = BASELINES[brand][engine];
  const launchIndex = TOTAL_DAYS - 1 - LAUNCH_DAYS_AGO;
  let walk = 0;

  return DATES.map((_, i) => {
    walk = walk * 0.86 + (rand() - 0.5) * 3.2;
    const weekly = Math.sin((i / 7) * Math.PI * 2) * 0.9;
    const drift = (i / TOTAL_DAYS) * (brand === "strata" ? -4 : 1.5);
    let lift = 0;
    if (brand === "halcyon" && i > launchIndex) {
      // Ease-out ramp: indexing takes a couple of weeks to show up.
      const t = Math.min(1, (i - launchIndex) / 24);
      lift = LAUNCH_LIFT[engine] * (1 - Math.pow(1 - t, 3));
    }
    if (brand === "strata" && i > launchIndex) {
      lift = -LAUNCH_LIFT[engine] * 0.35 * Math.min(1, (i - launchIndex) / 30);
    }
    return clamp(base + walk + weekly + drift + lift, 2, 95);
  });
}

export const SERIES: Record<BrandId, Record<EngineId, number[]>> =
  Object.fromEntries(
    BRANDS.map((b) => [
      b.id,
      Object.fromEntries(ENGINES.map((e) => [e.id, buildSeries(b.id, e.id)])),
    ]),
  ) as Record<BrandId, Record<EngineId, number[]>>;

export type EngineFilter = EngineId | "all";
export type RangeDays = 30 | 90;

/** Visibility series for a brand, averaged across engines when "all". */
export function visibilitySeries(brand: BrandId, engine: EngineFilter) {
  if (engine !== "all") return SERIES[brand][engine];
  return DATES.map(
    (_, i) =>
      ENGINES.reduce((sum, e) => sum + SERIES[brand][e.id][i], 0) /
      ENGINES.length,
  );
}

export const mean = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);

/** Current window and the equal-length window right before it. */
export function windows<T>(values: T[], days: RangeDays) {
  return {
    current: values.slice(-days),
    previous: values.slice(-days * 2, -days),
  };
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const PROMPTS_SEED: { text: string; topic: Topic; volume: number }[] = [
  { text: "Best running shoes for flat feet", topic: "Fit & injury", volume: 48200 },
  { text: "Most comfortable running shoes for beginners", topic: "Buying guides", volume: 39100 },
  { text: "Best cushioned shoes for marathon training", topic: "Buying guides", volume: 27400 },
  { text: "Halcyon Drift vs Strata Glide", topic: "Comparisons", volume: 6800 },
  { text: "Running shoes that help with shin splints", topic: "Fit & injury", volume: 22900 },
  { text: "Most durable trail running shoes", topic: "Trail", volume: 18300 },
  { text: "Best waterproof trail shoes for winter", topic: "Trail", volume: 12600 },
  { text: "Are carbon plate shoes worth it for amateurs?", topic: "Buying guides", volume: 15700 },
  { text: "Sustainable running shoe brands", topic: "Sustainability", volume: 9400 },
  { text: "Running shoes made from recycled materials", topic: "Sustainability", volume: 7100 },
  { text: "Kinetik Pulse vs Halcyon Drift for wide feet", topic: "Comparisons", volume: 3900 },
  { text: "Best running shoes for plantar fasciitis", topic: "Fit & injury", volume: 33800 },
  { text: "Lightweight shoes for 5K races", topic: "Buying guides", volume: 11200 },
  { text: "Best trail shoes for technical terrain", topic: "Trail", volume: 8700 },
  { text: "Strata vs Arcfoot: which lasts longer?", topic: "Comparisons", volume: 2600 },
  { text: "Running shoes with the best return policy", topic: "Buying guides", volume: 5300 },
  { text: "How to choose running shoes for overpronation", topic: "Fit & injury", volume: 19800 },
  { text: "Which running shoe brands have repair programs?", topic: "Sustainability", volume: 2100 },
  { text: "Best budget running shoes under $120", topic: "Buying guides", volume: 26500 },
  { text: "Best ultramarathon trail shoes", topic: "Trail", volume: 6400 },
];

const REASONS: Record<BrandId, string[]> = {
  halcyon: [
    "its responsive foam that keeps its bounce past 500 miles",
    "a roomy toe box and a stable, wide base",
    "independent lab tests showing low midsole wear",
    "a 90-day trial that lets runners return worn pairs",
  ],
  strata: [
    "a long track record and wide availability",
    "a soft, maximal stack that suits easy miles",
    "strong reviews from road runners",
  ],
  kinetik: [
    "an aggressive outsole with deep lugs",
    "a snug, race-oriented fit",
    "competitive pricing",
  ],
  arcfoot: [
    "a structured heel counter for overpronation",
    "a recycled-material upper",
  ],
};

const SOURCES: Citation[] = [
  { domain: "striderjournal.com", title: "The best running shoes we tested this year" },
  { domain: "halcyon.run", title: "How to choose a running shoe: the complete guide", own: true },
  { domain: "trailmetrics.io", title: "Outsole durability: 40 shoes, 300 miles each" },
  { domain: "footlab.health", title: "Footwear and plantar pain: what the research says" },
  { domain: "milesplit.forum", title: "Thread: Long-term review after 800 km" },
  { domain: "halcyon.run", title: "Drift 4 — lab-tested midsole wear", own: true },
  { domain: "geargrade.com", title: "Strata Glide review: soft but short-lived" },
  { domain: "greenstride.org", title: "Ranking running brands on circularity" },
];

function buildResult(
  prompt: (typeof PROMPTS_SEED)[number],
  engine: EngineId,
  index: number,
): EngineResult {
  const rand = mulberry32(hash(`${prompt.text}:${engine}`));
  const ownBias =
    (prompt.topic === "Buying guides" || prompt.topic === "Fit & injury" ? 0.18 : 0) +
    (engine === "perplexity" ? 0.1 : 0) -
    (engine === "gemini" ? 0.12 : 0) +
    (prompt.text.includes("Halcyon") ? 0.6 : 0);
  const mentioned = rand() < 0.5 + ownBias;

  // Competitors that appear in the answer, ordered by how often they rank.
  const competitors = (["strata", "kinetik", "arcfoot"] as BrandId[]).filter(
    (b) =>
      rand() < 0.55 + (b === "strata" ? 0.25 : 0) ||
      prompt.text.toLowerCase().includes(b),
  );

  const position = mentioned ? 1 + Math.floor(rand() * (competitors.length + 0.6)) : null;
  const sentimentRoll = rand();
  const sentiment: Sentiment | null = mentioned
    ? sentimentRoll < 0.68
      ? "positive"
      : sentimentRoll < 0.92
        ? "neutral"
        : "negative"
    : null;

  const visibility = mentioned
    ? clamp(0.45 + rand() * 0.5, 0, 1)
    : clamp(rand() * 0.3, 0, 1);
  const lift =
    prompt.topic === "Buying guides" || prompt.topic === "Fit & injury"
      ? 0.12 + rand() * 0.15
      : (rand() - 0.45) * 0.16;
  const previousVisibility = clamp(visibility - lift, 0, 1);

  // Build an answer that reads like an engine response.
  const ranked: BrandId[] = [...competitors];
  if (mentioned && position) ranked.splice(Math.min(position - 1, ranked.length), 0, "halcyon");
  const name = (id: BrandId) => BRANDS.find((b) => b.id === id)!.name;
  const reason = (id: BrandId) =>
    REASONS[id][Math.floor(rand() * REASONS[id].length)];

  const raw = prompt.text.replace(/\?$/, "");
  // Lowercase only the first letter so brand names keep their capitals.
  const subject = raw.charAt(0).toLowerCase() + raw.slice(1);
  const sentences = ranked.slice(0, 3).map((id, i) => {
    const lead =
      i === 0
        ? `For ${subject}, ${name(id)} is the most frequently recommended option, mainly for ${reason(id)}.`
        : i === 1
          ? `${name(id)} is a strong alternative thanks to ${reason(id)}.`
          : `${name(id)} also comes up, with reviewers pointing to ${reason(id)}.`;
    return lead;
  });
  if (sentiment === "negative") {
    sentences.push(
      "Some runners report that Halcyon's sizing runs half a size small, so trying a pair first is recommended.",
    );
  }
  if (!ranked.length) {
    sentences.push(
      `Answers to "${prompt.text}" tend to focus on fit criteria rather than specific brands.`,
    );
  }

  const citationCount = 2 + Math.floor(rand() * 3);
  const citations = Array.from({ length: citationCount }, (_, i) => {
    const pick = SOURCES[(index * 3 + i * 2 + (engine.length % 3)) % SOURCES.length];
    return pick;
  }).filter((c, i, arr) => arr.findIndex((x) => x.title === c.title) === i);

  return {
    engine,
    mentioned,
    position,
    sentiment,
    visibility,
    previousVisibility,
    answer: sentences.join(" "),
    competitors,
    citations,
  };
}

export const PROMPTS: Prompt[] = PROMPTS_SEED.map((p, i) => ({
  id: `p${String(i + 1).padStart(2, "0")}`,
  text: p.text,
  topic: p.topic,
  volume: p.volume,
  results: ENGINES.map((e) => buildResult(p, e.id, i)),
}));

/** Aggregate a prompt's metrics for the current engine filter. */
export function promptMetrics(prompt: Prompt, engine: EngineFilter) {
  const results =
    engine === "all"
      ? prompt.results
      : prompt.results.filter((r) => r.engine === engine);
  const positions = results.flatMap((r) => (r.position ? [r.position] : []));
  const sentiments = results.flatMap((r) => (r.sentiment ? [r.sentiment] : []));
  const visibility = mean(results.map((r) => r.visibility));
  const previous = mean(results.map((r) => r.previousVisibility));
  const score = (s: Sentiment) => (s === "positive" ? 1 : s === "neutral" ? 0 : -1);
  const sentimentScore = sentiments.length ? mean(sentiments.map(score)) : null;

  return {
    visibility,
    delta: visibility - previous,
    position: positions.length ? mean(positions) : null,
    sentiment:
      sentimentScore === null
        ? null
        : sentimentScore > 0.34
          ? ("positive" as const)
          : sentimentScore < -0.2
            ? ("negative" as const)
            : ("neutral" as const),
    mentionedIn: results.filter((r) => r.mentioned).length,
    total: results.length,
  };
}
