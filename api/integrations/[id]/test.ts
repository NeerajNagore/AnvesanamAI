import type { VercelRequest, VercelResponse } from "../../_lib/types";
import { getKey, setCorsHeaders } from "../../_lib/config";
import { tavilySearch } from "../../_lib/tavily";
import { fetchNews } from "../../_lib/news";
import { fetchWeather } from "../../_lib/weather";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) || "";

  if (id !== "weather" && !getKey(id)) {
    return res.status(200).json({ ok: false, message: "No key configured." });
  }

  try {
    if (id === "grok" || id === "openai") {
      const key = getKey(id);
      const testRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!testRes.ok) {
        return res.status(200).json({ ok: false, message: "Groq rejected the API key." });
      }
    } else if (id === "tavily") {
      await tavilySearch("test", { maxResults: 1 });
    } else if (id === "newsapi") {
      await fetchNews("technology", "", 1);
    } else if (id === "weather") {
      await fetchWeather({ lat: 18.52, lon: 73.86, units: "metric", name: "Test" });
    }
    return res.status(200).json({ ok: true, message: "Connection successful." });
  } catch (err: any) {
    return res.status(200).json({ ok: false, message: err.message || "Could not reach the provider." });
  }
}
