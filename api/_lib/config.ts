import type { VercelRequest, VercelResponse } from "./types";

// In-memory runtime store for keys saved from the UI during current session
const runtimeKeys = new Map<string, string>();

export const ENV_NAMES: Record<string, string> = {
  grok: "GROQ_API_KEY",
  openai: "OPENAI_API_KEY",
  tavily: "TAVILY_API_KEY",
  newsapi: "NEWSAPI_KEY",
};

export const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
export const NEWS_COUNTRY = process.env.NEWS_COUNTRY || "in";

export const LANGUAGES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
};

export function getKey(integration: string): string | null {
  const fromRuntime = runtimeKeys.get(integration);
  if (fromRuntime && fromRuntime.trim()) return fromRuntime.trim();

  const envVar = ENV_NAMES[integration];
  if (envVar && process.env[envVar] && process.env[envVar]!.trim()) {
    return process.env[envVar]!.trim();
  }

  // Fallback check for grok -> OPENAI_API_KEY if GROQ_API_KEY not set
  if (integration === "grok" && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    return process.env.OPENAI_API_KEY.trim();
  }

  return null;
}

export function setKey(integration: string, key: string): void {
  runtimeKeys.set(integration, key.trim());
}

export function deleteKey(integration: string): void {
  runtimeKeys.delete(integration);
}

export function sourceOf(integration: string): "ui" | "env" | null {
  if (runtimeKeys.has(integration) && runtimeKeys.get(integration)) return "ui";
  const envVar = ENV_NAMES[integration];
  if (envVar && process.env[envVar] && process.env[envVar]!.trim()) return "env";
  if (integration === "grok" && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) return "env";
  return null;
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin as string) || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
