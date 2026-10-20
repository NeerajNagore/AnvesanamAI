import type { VercelRequest, VercelResponse } from "./_lib/types";
import { setCorsHeaders } from "./_lib/config";
import { fetchNews } from "./_lib/news";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const category = (Array.isArray(req.query.category) ? req.query.category[0] : req.query.category) || "all";
  const q = (Array.isArray(req.query.q) ? req.query.q[0] : req.query.q) || "";

  try {
    const articles = await fetchNews(category, q);
    return res.status(200).json({ articles });
  } catch (err: any) {
    return res.status(502).json({ detail: err.message || "Failed to fetch news articles" });
  }
}
