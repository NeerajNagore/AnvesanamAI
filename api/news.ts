import crypto from "crypto";

function uid(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}

const CATEGORY_TOPICS: Record<string, string> = {
  technology: "TECHNOLOGY",
  business: "BUSINESS",
  science: "SCIENCE",
  health: "HEALTH",
  sports: "SPORTS",
  world: "WORLD",
  entertainment: "ENTERTAINMENT",
};

async function fetchFromGoogleRss(category: string, q: string): Promise<any[]> {
  let url = "https://news.google.com/rss?hl=en&gl=US&ceid=US:en";
  if (q.trim()) {
    url = `https://news.google.com/rss/search?q=${encodeURIComponent(q.trim())}&hl=en&gl=US&ceid=US:en`;
  } else if (category && CATEGORY_TOPICS[category.toLowerCase()]) {
    url = `https://news.google.com/rss/headlines/section/topic/${CATEGORY_TOPICS[category.toLowerCase()]}?hl=en&gl=US&ceid=US:en`;
  }

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AnvesanamAI/1.0)" },
  });

  if (!response.ok) return [];
  const xml = await response.text();

  const articles: any[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && articles.length < 24) {
    const block = match[1];
    let title = (/<title>([\s\S]*?)<\/title>/.exec(block) || [])[1] || "";
    const link = (/<link>([\s\S]*?)<\/link>/.exec(block) || [])[1] || "";
    const pubDate = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(block) || [])[1] || "";
    const source = (/<source[^>]*>([\s\S]*?)<\/source>/.exec(block) || [])[1] || "Live News";

    // Clean CDATA
    title = title.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
    // Remove trailing source if present in title "Headline - Source"
    const cleanedTitle = title.replace(/\s+-\s+[^-]+$/, "").trim();

    if (!link || !title) continue;

    articles.push({
      id: uid(link),
      title: cleanedTitle || title,
      summary: `Reported by ${source}. Published on ${pubDate || "recently"}. Click to read the full live coverage.`,
      url: link,
      source,
      category: category || "world",
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  return articles;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const category = (Array.isArray(req.query?.category) ? req.query.category[0] : req.query?.category) || "all";
  const q = (Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q) || "";

  const tavilyKey = process.env.TAVILY_API_KEY;
  const newsApiKey = process.env.NEWSAPI_KEY;

  // 1. Try GNews if NEWSAPI_KEY configured
  if (newsApiKey) {
    try {
      const gnewsUrl = q.trim()
        ? `https://gnews.io/api/v4/search?q=${encodeURIComponent(q.trim())}&apikey=${newsApiKey}&lang=en&max=15`
        : `https://gnews.io/api/v4/top-headlines?category=${category === "all" ? "general" : category}&apikey=${newsApiKey}&lang=en&country=in&max=15`;
      const gres = await fetch(gnewsUrl);
      if (gres.ok) {
        const data = await gres.json();
        if (data.articles && data.articles.length > 0) {
          const articles = data.articles.map((a: any) => ({
            id: uid(a.url),
            title: a.title,
            summary: a.description || (a.content || "").slice(0, 240),
            url: a.url,
            source: a.source?.name || "News",
            category: category || "world",
            publishedAt: a.publishedAt || new Date().toISOString(),
            imageUrl: a.image || undefined,
          }));
          return res.status(200).json({ articles });
        }
      }
    } catch {
      /* continue to fallback */
    }
  }

  // 2. Try Tavily topic=news if TAVILY_API_KEY configured
  if (tavilyKey) {
    try {
      const query = q.trim() || `latest ${category === "all" ? "world" : category} news today`;
      const tres = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tavilyKey}` },
        body: JSON.stringify({ query, max_results: 15, search_depth: "basic", topic: "news" }),
      });
      if (tres.ok) {
        const data = await tres.json();
        if (data.results && data.results.length > 0) {
          const articles = data.results.map((r: any) => ({
            id: uid(r.url),
            title: r.title,
            summary: (r.content || "").slice(0, 240),
            url: r.url,
            source: r.source || "Web News",
            category: category || "world",
            publishedAt: r.published_date || new Date().toISOString(),
          }));
          return res.status(200).json({ articles });
        }
      }
    } catch {
      /* continue to fallback */
    }
  }

  // 3. Fallback to live RSS (Zero keys required, guaranteed fresh real-time news)
  try {
    const articles = await fetchFromGoogleRss(category, q);
    if (articles.length > 0) {
      return res.status(200).json({ articles });
    }
  } catch (err: any) {
    return res.status(502).json({ detail: "Unable to retrieve news feeds" });
  }

  return res.status(200).json({ articles: [] });
}
