import type { VercelRequest, VercelResponse } from "../_lib/types";
import { setCorsHeaders, sourceOf } from "../_lib/config";

const KEYED = ["grok", "tavily", "newsapi"];

function getStatus(id: string) {
  if (id === "weather") {
    return {
      id: "weather",
      configured: true,
      message: "Using Open-Meteo (free, no key required).",
    };
  }

  const src = sourceOf(id);
  const msg =
    src === "env"
      ? "Key loaded from server environment."
      : src === "ui"
      ? "Key stored on server session."
      : undefined;

  return {
    id,
    configured: src !== null,
    ...(msg ? { message: msg } : {}),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method === "GET") {
    return res.status(200).json({
      integrations: [...KEYED.map(getStatus), getStatus("weather")],
    });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}
