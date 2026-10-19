/**
 * Demo data used when no backend is connected (VITE_API_BASE_URL is unset).
 * Everything here is placeholder content — it is never presented as real news or research,
 * and the UI labels it as demo data wherever it is shown.
 */
import type {
  GeoLocation,
  NewsArticle,
  NewsCategory,
  ResearchDepth,
  ResearchReport,
  Source,
  Units,
  WeatherData,
} from "@/types";
import { domainOf, truncate, uid } from "./utils";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

type Seed = [NewsCategory, string, string, string, number];

const NEWS_SEEDS: Seed[] = [
  ["technology", "Open-weight language models close the gap on proprietary systems", "A demo summary describing how smaller, efficient models are increasingly competitive on everyday benchmarks.", "Demo Tech Daily", 18],
  ["technology", "Chipmakers outline roadmap for energy-efficient AI accelerators", "Placeholder article about the push for lower power consumption in data-center hardware.", "Demo Silicon Weekly", 55],
  ["technology", "Browser vendors agree on new privacy standard for cross-site tracking", "Sample story showing how a news card looks with a mid-length summary and source label.", "Demo Web Report", 140],
  ["business", "Global markets steady as investors weigh central bank signals", "Demo content: a short market wrap used to preview the business category layout.", "Demo Markets Wire", 32],
  ["business", "Logistics firms invest in autonomous warehouse robotics", "Placeholder summary about automation investment in supply chains.", "Demo Business Journal", 95],
  ["business", "Startups report record funding for climate-focused hardware", "Sample story demonstrating filters, sorting and category tabs.", "Demo Venture Brief", 210],
  ["science", "Astronomers publish new survey of nearby exoplanet atmospheres", "Demo summary describing a catalogue of atmospheric measurements.", "Demo Science Today", 41],
  ["science", "Battery researchers demonstrate faster-charging solid-state prototype", "Placeholder article used to show the science category.", "Demo Lab Notes", 120],
  ["science", "Ocean monitoring network expands with low-cost sensor buoys", "Sample item with generic copy for layout testing.", "Demo Earth Report", 305],
  ["health", "Large study examines links between sleep regularity and long-term health", "Demo summary: no real study is referenced. Connect NewsAPI for live health coverage.", "Demo Health Digest", 66],
  ["health", "Hospitals pilot AI tools to reduce administrative paperwork", "Placeholder story about workflow tools in clinical settings.", "Demo Care Weekly", 175],
  ["health", "Public health agencies publish updated seasonal guidance", "Sample article for the health category.", "Demo Wellness Wire", 260],
  ["sports", "Late goal decides tightly contested league fixture", "Demo sports item — scores and teams here are fictional placeholders.", "Demo Sports Desk", 25],
  ["sports", "Marathon organisers announce new qualifying standards", "Placeholder summary about event logistics.", "Demo Athletics Net", 150],
  ["sports", "Youth academies expand data-driven training programmes", "Sample article to show how sports cards render.", "Demo Pitch Report", 330],
  ["world", "Regional leaders convene to discuss shared infrastructure funding", "Demo summary: placeholder text for the world category.", "Demo World Service", 48],
  ["world", "Cities trial congestion pricing alongside new transit lines", "Sample story for layout and filter testing.", "Demo Urban Review", 130],
  ["world", "International team begins restoration of historic harbour district", "Placeholder article illustrating longer headlines in the card grid.", "Demo Heritage News", 280],
  ["entertainment", "Independent film festival unveils this year's competition line-up", "Demo entertainment item with fictional details.", "Demo Screen Daily", 72],
  ["entertainment", "Streaming services experiment with interactive live events", "Placeholder summary about a hypothetical format.", "Demo Stream Guide", 185],
  ["entertainment", "Touring orchestras collaborate with game composers on new concert series", "Sample story to complete the demo set.", "Demo Culture Wire", 350],
];

export function demoNews(): NewsArticle[] {
  return NEWS_SEEDS.map(([category, title, summary, source, mins], i) => ({
    id: `demo-news-${i}`,
    title,
    summary,
    source,
    category,
    publishedAt: minutesAgo(mins),
    url: `https://example.com/demo-news/${i + 1}`,
  }));
}

const SOURCE_TEMPLATES: [string, string, string][] = [
  ["Overview and background", "https://example.com/demo/overview", "A neutral explainer that frames the topic and defines key terms."],
  ["Latest developments", "https://example.org/demo/latest", "Recent reporting on what has changed in the past few weeks."],
  ["Expert analysis", "https://example.net/demo/analysis", "Commentary from domain specialists on implications and trade-offs."],
  ["Data and statistics", "https://example.com/demo/data", "Figures and charts from a public dataset, with methodology notes."],
  ["Counter-arguments", "https://example.org/demo/critique", "A critical perspective summarising common objections."],
  ["Practical guide", "https://example.net/demo/guide", "How-to oriented material for applying the findings."],
  ["Historical context", "https://example.com/demo/history", "A timeline showing how the topic evolved."],
  ["Regional perspectives", "https://example.org/demo/regional", "Comparisons across countries and regions."],
  ["Policy and regulation", "https://example.net/demo/policy", "Summary of current rules and proposed changes."],
  ["Further reading", "https://example.com/demo/reading", "Curated links for deeper study."],
];

export function demoSources(query: string, count = 5): Source[] {
  const q = truncate(query.trim(), 48);
  return SOURCE_TEMPLATES.slice(0, Math.min(count, SOURCE_TEMPLATES.length)).map(([title, url, snippet], i) => ({
    id: i + 1,
    title: `[Demo] ${title}: ${q}`,
    url,
    domain: domainOf(url),
    snippet,
    publishedAt: minutesAgo((i + 1) * 1440),
  }));
}

export function buildDemoAnswer(query: string, webSearch: boolean) {
  const q = truncate(query.trim().replace(/\s+/g, " "), 80);
  const sources = webSearch ? demoSources(query, 5) : [];
  const c = (...n: number[]) => (webSearch ? " " + n.map((i) => `[${i}]`).join("") : "");

  const text = [
    "> **Demo response.** No AI backend is connected, so this answer is generated locally as a placeholder. Sources below are fictional.",
    "",
    "## Short answer",
    `Here is how ANVEṢAṆAM AI would approach **${q}**: search the live web, cross-check several independent sources, and summarise the consensus with citations${c(1, 2)}.`,
    "",
    "## Key points",
    `- **Context:** the topic is framed using recent, reputable reporting${c(1)}.`,
    `- **Evidence:** claims are compared across at least three sources before being stated${c(2, 3)}.`,
    `- **Disagreement:** where sources conflict, both positions are shown side by side${c(5)}.`,
    `- **Freshness:** publication dates are displayed so you can judge how current each source is${c(4)}.`,
    "",
    webSearch
      ? "## Next step\nConnect the FastAPI backend (see the README) to replace this placeholder with real, cited answers."
      : "## Note\nWeb search is switched off, so a live answer would rely on the model's built-in knowledge only. Turn on web search for cited, up-to-date results.",
  ].join("\n");

  const followUps = [
    "Summarise this in three bullet points",
    "What are the strongest counter-arguments?",
    "What changed in the last month?",
  ];

  return { text, sources, followUps };
}

export function buildDemoReport(query: string, depth: ResearchDepth, maxSources: number, includeNews: boolean): ResearchReport {
  const q = truncate(query.trim().replace(/\s+/g, " "), 90);
  const sourceCount = Math.max(3, Math.min(maxSources, depth === "quick" ? 4 : depth === "standard" ? 6 : 10));
  const sources = demoSources(query, sourceCount);
  const cite = (...n: number[]) => " " + n.filter((i) => i <= sources.length).map((i) => `[${i}]`).join("");

  const sections = [
    {
      heading: "Background",
      body: `This is a demo report for **${q}**. A live run would gather background from authoritative references and define the terms used throughout${cite(1)}.`,
    },
    {
      heading: "Current landscape",
      body: `Recent coverage would be summarised here, highlighting what is new, who is involved and where sources agree${cite(2, 3)}.${includeNews ? " Recent news items are included in the analysis." : ""}`,
    },
  ];
  if (depth !== "quick") {
    sections.push({
      heading: "Competing perspectives",
      body: `Where credible sources disagree, each position is presented with its strongest supporting evidence${cite(5)}.\n- **Position A:** summarised with citations.\n- **Position B:** summarised with citations.`,
    });
  }
  if (depth === "deep") {
    sections.push(
      { heading: "Data and evidence quality", body: `A deep run weighs methodology and recency of each dataset and flags weak evidence${cite(4)}.` },
      { heading: "Open questions", body: "Gaps that need further research are listed so you know what remains uncertain." },
    );
  }

  return {
    id: uid(),
    title: `Research: ${q}`,
    query,
    summary: `Demo summary for “${q}”. Connect the backend to generate a real synthesis from live sources. The structure below (summary, key findings, analysis, sources) is exactly what a live report contains.`,
    keyFindings: [
      "Sources are retrieved, ranked and de-duplicated before analysis.",
      "Each claim in the analysis links back to one or more numbered sources.",
      "Conflicting evidence is surfaced rather than hidden.",
      "Publication dates are shown so you can judge freshness.",
      "Reports can be saved, exported as Markdown or JSON, or printed to PDF.",
    ],
    sections,
    sources,
    depth,
    createdAt: new Date().toISOString(),
    demo: true,
  };
}

export function demoWeather(location: GeoLocation, units: Units): WeatherData {
  const metric = units === "metric";
  const conv = (c: number) => Math.round(metric ? c : c * 1.8 + 32);
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const codes = [1, 2, 2, 3, 61, 80, 2];

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() + i * 3_600_000);
    const h = d.getHours();
    return {
      time: d.toISOString(),
      temperature: conv(18 + 7 * Math.sin(((h - 9) / 24) * 2 * Math.PI)),
      code: codes[Math.floor(i / 4) % codes.length],
      precipProb: [5, 10, 20, 40, 15, 5][Math.floor(i / 4) % 6],
      isDay: h >= 6 && h < 19,
    };
  });

  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86_400_000);
    const day = d.toISOString().slice(0, 10);
    return {
      date: day,
      max: conv(25 + ((i * 3) % 5)),
      min: conv(15 + ((i * 2) % 4)),
      code: codes[i % codes.length],
      precipProb: [10, 20, 35, 60, 25, 10, 15][i],
      sunrise: `${day}T06:12`,
      sunset: `${day}T18:48`,
      uv: [6, 7, 5, 4, 6, 7, 6][i],
    };
  });

  return {
    location: { ...location, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    units,
    current: {
      temperature: conv(22),
      apparent: conv(23),
      humidity: 58,
      windSpeed: metric ? 14 : 9,
      pressure: 1014,
      precipitation: 0,
      code: 2,
      isDay: true,
      time: now.toISOString(),
    },
    hourly,
    daily,
    demo: true,
    fetchedAt: new Date().toISOString(),
  };
}

export const SUGGESTED_PROMPTS: { title: string; prompt: string; tag: string }[] = [
  { title: "Explain a hot topic", prompt: "What are the biggest developments in AI this month, and why do they matter?", tag: "Trending" },
  { title: "Compare options", prompt: "Compare electric vs hybrid cars for city commuting: cost, range and maintenance.", tag: "Compare" },
  { title: "Fact-check a claim", prompt: "Is it true that drinking 8 glasses of water a day is necessary? Cite sources.", tag: "Fact-check" },
  { title: "Market snapshot", prompt: "Summarise this week's major market moves and the key drivers behind them.", tag: "Finance" },
  { title: "Plan a trip", prompt: "Plan a 3-day itinerary for Kyoto in autumn with food and temple recommendations.", tag: "Travel" },
  { title: "Learn something new", prompt: "Explain how retrieval-augmented generation works, with a simple example.", tag: "Learn" },
];
