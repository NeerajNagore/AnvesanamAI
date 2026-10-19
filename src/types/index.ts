export type Lang = "en" | "hi" | "es" | "fr" | "de" | "ja";
export type ThemeMode = "dark" | "light" | "system";
export type Units = "metric" | "imperial";
export type ResearchDepth = "quick" | "standard" | "deep";

export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  followUps?: string[];
  status?: "streaming" | "done" | "error";
  error?: string;
  demo?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export type NewsCategory =
  | "technology"
  | "business"
  | "science"
  | "health"
  | "sports"
  | "world"
  | "entertainment";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
}

export interface ReportSection {
  heading: string;
  body: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  query: string;
  summary: string;
  keyFindings: string[];
  sections: ReportSection[];
  sources: Source[];
  depth: ResearchDepth;
  createdAt: string;
  demo: boolean;
}

export interface GeoLocation {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  location: GeoLocation & { timezone: string };
  units: Units;
  current: {
    temperature: number;
    apparent: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    precipitation: number;
    code: number;
    isDay: boolean;
    time: string;
  };
  hourly: { time: string; temperature: number; code: number; precipProb: number; isDay: boolean }[];
  daily: {
    date: string;
    max: number;
    min: number;
    code: number;
    precipProb: number;
    sunrise: string;
    sunset: string;
    uv: number;
  }[];
  demo: boolean;
  fetchedAt: string;
}

export type IntegrationId = "openai" | "grok" | "tavily" | "newsapi" | "weather";

export interface IntegrationStatus {
  id: IntegrationId;
  configured: boolean;
  message?: string;
  lastTestedAt?: string;
}

export interface Settings {
  displayName: string;
  language: Lang;
  theme: ThemeMode;
  units: Units;
  location: GeoLocation;
  savedCities: GeoLocation[];
  researchDepth: ResearchDepth;
  maxSources: number;
  includeNews: boolean;
  autoSaveReports: boolean;
  showCitations: boolean;
  webSearchDefault: boolean;
}

export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "sources"; sources: Source[] }
  | { type: "followups"; items: string[] }
  | { type: "error"; message: string }
  | { type: "done" };
