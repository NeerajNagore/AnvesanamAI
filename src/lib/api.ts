/**
 * ANVEṢAṆAM AI API client.
 *
 * - If VITE_API_BASE_URL is set (e.g. "/api" with the Vite proxy, or "https://api.example.com"),
 *   every call goes to the Python FastAPI backend, which holds all API keys.
 * - If it is not set, the app runs in DEMO MODE: chat, research and news use clearly-labelled
 *   demo data, while weather uses the real, keyless Open-Meteo API.
 *
 * No secret is ever read from, or written to, frontend code or browser storage.
 */
import type {
  ChatMessage,
  GeoLocation,
  IntegrationId,
  IntegrationStatus,
  Lang,
  NewsArticle,
  ResearchDepth,
  ResearchReport,
  StreamEvent,
  Units,
  WeatherData,
} from "@/types";
import { buildDemoAnswer, buildDemoReport, demoNews, demoWeather } from "./demo";
import { uid } from "./utils";

export const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api").replace(/\/+$/, "");
export const hasBackend = true;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isAbort = (e: unknown) => e instanceof DOMException && e.name === "AbortError";
export { isAbort };

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new ApiError("Cannot reach the backend. Check that the API server is running.");
  }
  if (!res.ok) {
    let detail = res.statusText || "Request failed";
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status);
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ chat */

export interface ChatRequest {
  messages: Pick<ChatMessage, "role" | "content">[];
  webSearch: boolean;
  language: Lang;
}

/** Streams a chat answer. Backend contract: POST {API}/chat/stream → Server-Sent Events whose `data:` lines are StreamEvent JSON. */
export async function streamChat(req: ChatRequest, onEvent: (e: StreamEvent) => void, signal: AbortSignal): Promise<void> {
  if (!hasBackend) {
    const last = [...req.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const { text, sources, followUps } = buildDemoAnswer(last, req.webSearch);
    await sleep(req.webSearch ? 700 : 350, signal);
    if (sources.length) onEvent({ type: "sources", sources });
    const chunks = text.match(/\S+\s*/g) ?? [text];
    for (const chunk of chunks) {
      await sleep(18 + Math.random() * 22, signal);
      onEvent({ type: "token", text: chunk });
    }
    onEvent({ type: "followups", items: followUps });
    onEvent({ type: "done" });
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new ApiError("Cannot reach the backend. Check that the API server is running.");
  }
  if (!res.ok || !res.body) throw new ApiError(res.statusText || "Chat request failed", res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") {
        onEvent({ type: "done" });
        return;
      }
      try {
        onEvent(JSON.parse(payload) as StreamEvent);
      } catch {
        /* ignore malformed frame */
      }
    }
  }
  onEvent({ type: "done" });
}

/* -------------------------------------------------------------- research */

export interface ResearchRequest {
  query: string;
  depth: ResearchDepth;
  maxSources: number;
  includeNews: boolean;
  language: Lang;
}

export const RESEARCH_STAGES = ["Searching the web", "Reading sources", "Analysing evidence", "Writing summary"] as const;

/** Backend contract: POST {API}/research → ResearchReport JSON. */
export async function runResearch(req: ResearchRequest, onStage: (i: number) => void, signal: AbortSignal): Promise<ResearchReport> {
  if (!hasBackend) {
    for (let i = 0; i < RESEARCH_STAGES.length; i++) {
      onStage(i);
      await sleep(650 + (req.depth === "deep" ? 500 : 0), signal);
    }
    return buildDemoReport(req.query, req.depth, req.maxSources, req.includeNews);
  }
  onStage(0);
  let stage = 0;
  const timer = setInterval(() => {
    stage = Math.min(RESEARCH_STAGES.length - 1, stage + 1);
    onStage(stage);
  }, 4000);
  try {
    const report = await request<Omit<ResearchReport, "id" | "createdAt" | "demo"> & Partial<ResearchReport>>("/research", {
      method: "POST",
      body: JSON.stringify(req),
      signal,
    });
    return { ...report, id: report.id ?? uid(), createdAt: report.createdAt ?? new Date().toISOString(), demo: false, depth: req.depth, query: req.query };
  } finally {
    clearInterval(timer);
  }
}

/* ------------------------------------------------------------------ news */

export async function getNews(params: { category: string; q: string }, signal?: AbortSignal): Promise<{ articles: NewsArticle[]; demo: boolean }> {
  if (!hasBackend) {
    await sleep(450, signal);
    const q = params.q.trim().toLowerCase();
    const articles = demoNews().filter(
      (a) =>
        (params.category === "all" || a.category === params.category) &&
        (!q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)),
    );
    return { articles, demo: true };
  }
  const qs = new URLSearchParams({ category: params.category, q: params.q });
  const data = await request<{ articles: NewsArticle[] }>(`/news?${qs}`, { signal });
  return { articles: data.articles, demo: false };
}

/* --------------------------------------------------------------- weather */

interface GeoResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

/** Open-Meteo geocoding — free, keyless, CORS-enabled. */
export async function searchCities(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new ApiError("City search is unavailable right now.", res.status);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? []).map((r) => ({
    name: r.admin1 && r.admin1 !== r.name ? `${r.name}, ${r.admin1}` : r.name,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

interface OpenMeteoResponse {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    pressure_msl: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: number[]; is_day: number[] };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
}

async function weatherFromOpenMeteo(location: GeoLocation, units: Units, signal?: AbortSignal): Promise<WeatherData> {
  const p = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
    temperature_unit: units === "metric" ? "celsius" : "fahrenheit",
    wind_speed_unit: units === "metric" ? "kmh" : "mph",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`, { signal });
  if (!res.ok) throw new ApiError("The weather service is unavailable right now.", res.status);
  const d = (await res.json()) as OpenMeteoResponse;

  const startIdx = Math.max(0, d.hourly.time.findIndex((t) => t >= d.current.time.slice(0, 13)));
  const hourly = d.hourly.time.slice(startIdx, startIdx + 24).map((time, i) => ({
    time,
    temperature: Math.round(d.hourly.temperature_2m[startIdx + i]),
    code: d.hourly.weather_code[startIdx + i],
    precipProb: d.hourly.precipitation_probability[startIdx + i] ?? 0,
    isDay: d.hourly.is_day[startIdx + i] === 1,
  }));

  return {
    location: { ...location, timezone: d.timezone },
    units,
    current: {
      temperature: Math.round(d.current.temperature_2m),
      apparent: Math.round(d.current.apparent_temperature),
      humidity: d.current.relative_humidity_2m,
      windSpeed: Math.round(d.current.wind_speed_10m),
      pressure: Math.round(d.current.pressure_msl),
      precipitation: d.current.precipitation,
      code: d.current.weather_code,
      isDay: d.current.is_day === 1,
      time: d.current.time,
    },
    hourly,
    daily: d.daily.time.map((date, i) => ({
      date,
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
      code: d.daily.weather_code[i],
      precipProb: d.daily.precipitation_probability_max[i] ?? 0,
      sunrise: d.daily.sunrise[i],
      sunset: d.daily.sunset[i],
      uv: Math.round(d.daily.uv_index_max[i] ?? 0),
    })),
    demo: false,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Real weather. With a backend configured, the backend is tried first (so a keyed provider such
 * as OpenWeatherMap can be used server-side); otherwise — or if it fails — Open-Meteo is called directly.
 */
export async function getWeather(location: GeoLocation, units: Units, signal?: AbortSignal): Promise<WeatherData> {
  if (hasBackend) {
    try {
      const qs = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude), units, name: location.name });
      const data = await request<WeatherData>(`/weather?${qs}`, { signal });
      return { ...data, demo: false };
    } catch (e) {
      if (isAbort(e)) throw e;
      /* fall through to the keyless provider */
    }
  }
  return weatherFromOpenMeteo(location, units, signal);
}

export const getDemoWeather = demoWeather;

/* ---------------------------------------------------------- integrations */

const DEFAULT_STATUSES: IntegrationStatus[] = [
  { id: "grok", configured: false },
  { id: "tavily", configured: false },
  { id: "newsapi", configured: false },
  { id: "weather", configured: true, message: "Using Open-Meteo (free, no key required)." },
];

/** Backend contract: GET {API}/integrations → { integrations: IntegrationStatus[] } (never includes key values). */
export async function getIntegrations(signal?: AbortSignal): Promise<IntegrationStatus[]> {
  if (!hasBackend) return DEFAULT_STATUSES;
  const data = await request<{ integrations: IntegrationStatus[] }>("/integrations", { signal });
  return data.integrations;
}

/** Backend contract: PUT {API}/integrations/{id} with { apiKey } — the key is stored server-side only. */
export async function saveIntegrationKey(id: IntegrationId, apiKey: string): Promise<void> {
  await request(`/integrations/${id}`, { method: "PUT", body: JSON.stringify({ apiKey }) });
}

export async function removeIntegrationKey(id: IntegrationId): Promise<void> {
  await request(`/integrations/${id}`, { method: "DELETE" });
}

export async function testIntegration(id: IntegrationId): Promise<{ ok: boolean; message: string }> {
  return request(`/integrations/${id}/test`, { method: "POST" });
}
