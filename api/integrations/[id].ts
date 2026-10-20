import type { VercelRequest, VercelResponse } from "../_lib/types";
import { deleteKey, setCorsHeaders, setKey } from "../_lib/config";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  const id = (Array.isArray(req.query.id) ? req.query.id[0] : req.query.id) || "";

  if (!id) {
    return res.status(400).json({ detail: "Missing integration id" });
  }

  if (id === "weather") {
    if (req.method === "PUT") {
      return res.status(400).json({ detail: "Weather uses Open-Meteo and needs no key." });
    }
    if (req.method === "DELETE") {
      return res.status(400).json({ detail: "Weather needs no key, so there is nothing to remove." });
    }
  }

  if (req.method === "PUT") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* ignore */
      }
    }

    const apiKey = body && body.apiKey ? String(body.apiKey).trim() : "";
    if (!apiKey) {
      return res.status(400).json({ detail: "Missing apiKey in request body" });
    }

    if (/\s/.test(apiKey)) {
      return res.status(400).json({ detail: "The key must not contain spaces or line breaks." });
    }

    setKey(id, apiKey);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    deleteKey(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}
