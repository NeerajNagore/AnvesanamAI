import crypto from "crypto";
import { getKey } from "./config";
import type { Source } from "./types";

export function uid(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}

export interface TavilySearchOptions {
  maxResults?: number;
  depth?: "basic" | "advanced";
  topic?: "general" | "news";
}

export async function tavilySearch(
  query: string,
  options: TavilySearchOptions = {}
): Promise<any[]> {
  const key = getKey("tavily");
  if (!key) {
    throw new Error("Web search is not configured. Add a Tavily API key on the Integrations page.");
  }

  const payload = {
    query: query.slice(0, 400),
    max_results: options.maxResults || 5,
    search_depth: options.depth || "basic",
    topic: options.topic || "general",
  };

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Tavily rejected the API key. Please check your key on the Integrations page.");
  }
  if (response.status === 429) {
    throw new Error("Tavily rate limit reached. Please try again shortly.");
  }
  if (!response.ok) {
    throw new Error(`Tavily search returned an error (${response.status}).`);
  }

  const data = await response.json();
  return data.results || [];
}

export function toSources(results: any[], startId: number = 1, snippetLen: number = 300): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];

  for (const res of results) {
    const url = res.url;
    if (!url || seen.has(url)) continue;
    seen.add(url);

    let domain = "web";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* ignore invalid url */
    }

    out.push({
      id: startId + out.length,
      title: ((res.title || domain) as string).slice(0, 200),
      url,
      domain,
      snippet: ((res.content || "") as string).slice(0, snippetLen),
      publishedAt: res.published_date || undefined,
      _content: ((res.content || "") as string).slice(0, 1500),
    });
  }

  return out;
}

export function publicSources(sources: Source[]): Source[] {
  return sources.map((s) => ({
    id: s.id,
    title: s.title,
    url: s.url,
    domain: s.domain,
    snippet: s.snippet,
    publishedAt: s.publishedAt,
  }));
}

export function sourcesBlock(sources: Source[]): string {
  return sources
    .map((s) => `[${s.id}] ${s.title} (${s.domain})\n${s._content || s.snippet}`)
    .join("\n\n");
}
