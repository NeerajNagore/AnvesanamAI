import { getKey, NEWS_COUNTRY } from "./config";
import { tavilySearch, uid } from "./tavily";
import type { NewsArticle } from "./types";

const GNEWS_BASE = "https://gnews.io/api/v4";
const NEWSAPI_BASE = "https://newsapi.org/v2";

const CATEGORY_MAP: Record<string, string> = {
  technology: "technology",
  business: "business",
  science: "science",
  health: "health",
  sports: "sports",
  world: "world",
  entertainment: "entertainment",
  all: "general",
};

const CATEGORY_QUERIES: Record<string, string> = {
  technology: "latest technology news",
  business: "latest business news",
  science: "latest science news",
  health: "latest health news",
  sports: "latest sports news",
  world: "latest world news",
  entertainment: "latest entertainment news",
  all: "latest news today",
};

async function fetchViaGNews(category: string, q: string, pageSize: number): Promise<NewsArticle[]> {
  const gnewsKey = getKey("newsapi");
  const catSlug = CATEGORY_MAP[category] || "general";
  const cat = category || "world";

  let url: string;
  const params = new URLSearchParams({
    lang: "en",
    max: String(Math.min(pageSize, 10)),
    sortby: "publishedAt",
  });

  if (q.trim()) {
    url = `${GNEWS_BASE}/search`;
    params.set("q", q.trim().slice(0, 200));
  } else {
    url = `${GNEWS_BASE}/top-headlines`;
    params.set("category", catSlug);
    params.set("country", NEWS_COUNTRY);
  }

  if (gnewsKey) {
    params.set("apikey", gnewsKey);
  }

  const response = await fetch(`${url}?${params.toString()}`);
  if (response.status === 401 || response.status === 403) {
    throw new Error("GNews API key rejected or required.");
  }
  if (response.status === 429) {
    throw new Error("News rate limit reached. Try again later.");
  }
  if (!response.ok) {
    throw new Error(`GNews returned status ${response.status}`);
  }

  const data = await response.json();
  const articles: NewsArticle[] = [];

  for (const a of data.articles || []) {
    const urlVal = a.url;
    const title = a.title;
    if (!urlVal || !title || title === "[Removed]") continue;

    articles.push({
      id: uid(urlVal),
      title,
      summary: a.description || (a.content ? a.content.slice(0, 240) : ""),
      url: urlVal,
      source: (a.source && a.source.name) || "Unknown",
      category: cat as any,
      publishedAt: a.publishedAt || "",
      imageUrl: a.image || undefined,
    });
  }

  return articles;
}

async function fetchViaNewsAPI(category: string, q: string, pageSize: number): Promise<NewsArticle[]> {
  const key = getKey("newsapi");
  if (!key) throw new Error("NewsAPI key not configured");

  const cat = category || "world";
  let url: string;
  const params = new URLSearchParams({
    pageSize: String(pageSize),
  });

  if (q.trim()) {
    url = `${NEWSAPI_BASE}/everything`;
    params.set("q", q.trim().slice(0, 200));
    params.set("sortBy", "publishedAt");
    params.set("language", "en");
  } else {
    url = `${NEWSAPI_BASE}/top-headlines`;
    params.set("country", NEWS_COUNTRY);
    if (category && category !== "all") {
      params.set("category", category === "world" ? "general" : category);
    }
  }

  const response = await fetch(`${url}?${params.toString()}`, {
    headers: { "X-Api-Key": key },
  });

  if (!response.ok) throw new Error(`NewsAPI error: ${response.status}`);
  const data = await response.json();

  const articles: NewsArticle[] = [];
  for (const a of data.articles || []) {
    if (!a.url || !a.title || a.title === "[Removed]") continue;
    articles.push({
      id: uid(a.url),
      title: a.title,
      summary: a.description || (a.content ? a.content.slice(0, 240) : ""),
      url: a.url,
      source: (a.source && a.source.name) || "Unknown",
      category: cat as any,
      publishedAt: a.publishedAt || "",
      imageUrl: a.urlToImage || undefined,
    });
  }

  return articles;
}

async function fetchViaTavily(category: string, q: string, pageSize: number): Promise<NewsArticle[]> {
  const query = q.trim() || CATEGORY_QUERIES[category] || "latest news today";
  const results = await tavilySearch(query, {
    maxResults: Math.min(pageSize, 10),
    depth: "basic",
    topic: "news",
  });

  const cat = category || "world";
  const articles: NewsArticle[] = [];

  for (const r of results) {
    if (!r.url || !r.title || r.title === "[Removed]") continue;
    articles.push({
      id: uid(r.url),
      title: r.title,
      summary: (r.content || "").slice(0, 240),
      url: r.url,
      source: r.source || "News",
      category: cat as any,
      publishedAt: r.published_date || "",
    });
  }

  return articles;
}

export async function fetchNews(category: string = "all", q: string = "", pageSize: number = 24): Promise<NewsArticle[]> {
  // 1. Try GNews
  try {
    const articles = await fetchViaGNews(category, q, pageSize);
    if (articles.length > 0) return articles;
  } catch (err) {
    // continue to fallbacks
  }

  // 2. Try NewsAPI if configured
  if (getKey("newsapi")) {
    try {
      const articles = await fetchViaNewsAPI(category, q, pageSize);
      if (articles.length > 0) return articles;
    } catch {
      // continue to Tavily
    }
  }

  // 3. Try Tavily topic=news
  if (getKey("tavily")) {
    try {
      const articles = await fetchViaTavily(category, q, pageSize);
      if (articles.length > 0) return articles;
    } catch {
      // fall through
    }
  }

  throw new Error("Could not fetch live news headlines. Please verify API keys on the Integrations page.");
}
