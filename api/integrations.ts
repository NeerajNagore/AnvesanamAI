const runtimeKeys = new Map<string, string>();

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const id = (Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id) || "";
  const action = (Array.isArray(req.query?.action) ? req.query.action[0] : req.query?.action) || "";

  // 1. GET /api/integrations -> List statuses
  if (req.method === "GET") {
    const checkStatus = (providerId: string) => {
      if (providerId === "weather") {
        return {
          id: "weather",
          configured: true,
          message: "Using Open-Meteo (free, no key required).",
        };
      }

      const envMap: Record<string, string | undefined> = {
        grok: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
        openai: process.env.OPENAI_API_KEY,
        tavily: process.env.TAVILY_API_KEY,
        newsapi: process.env.NEWSAPI_KEY,
      };

      const hasEnv = Boolean(envMap[providerId]?.trim());
      const hasRuntime = Boolean(runtimeKeys.get(providerId)?.trim());
      const configured = hasEnv || hasRuntime;

      const message = hasRuntime
        ? "Key stored on server session."
        : hasEnv
        ? "Key loaded from server environment."
        : undefined;

      return {
        id: providerId,
        configured,
        ...(message ? { message } : {}),
      };
    };

    return res.status(200).json({
      integrations: [
        checkStatus("grok"),
        checkStatus("tavily"),
        checkStatus("newsapi"),
        checkStatus("weather"),
      ],
    });
  }

  // 2. POST /api/integrations/:id/test -> Test connectivity
  if (req.method === "POST" && (action === "test" || req.url?.includes("/test"))) {
    const key =
      runtimeKeys.get(id) ||
      (id === "grok"
        ? process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
        : id === "tavily"
        ? process.env.TAVILY_API_KEY
        : id === "newsapi"
        ? process.env.NEWSAPI_KEY
        : null);

    if (id !== "weather" && !key) {
      return res.status(200).json({ ok: false, message: "No key configured." });
    }

    try {
      if (id === "grok" || id === "openai") {
        const testRes = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!testRes.ok) {
          return res.status(200).json({ ok: false, message: "Groq rejected the API key." });
        }
      } else if (id === "tavily") {
        const testRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ query: "test", max_results: 1 }),
        });
        if (!testRes.ok) {
          return res.status(200).json({ ok: false, message: "Tavily rejected the API key." });
        }
      } else if (id === "weather") {
        const testRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&current=temperature_2m"
        );
        if (!testRes.ok) {
          return res.status(200).json({ ok: false, message: "Could not reach Open-Meteo." });
        }
      }
      return res.status(200).json({ ok: true, message: "Connection successful." });
    } catch (err: any) {
      return res.status(200).json({ ok: false, message: err.message || "Could not reach provider" });
    }
  }

  // 3. PUT /api/integrations/:id -> Save key
  if (req.method === "PUT") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const apiKey = (body?.apiKey as string)?.trim();
    if (!apiKey) {
      return res.status(400).json({ detail: "Missing apiKey in request body" });
    }
    if (/\s/.test(apiKey)) {
      return res.status(400).json({ detail: "The key must not contain spaces or line breaks." });
    }
    runtimeKeys.set(id, apiKey);
    return res.status(200).json({ ok: true });
  }

  // 4. DELETE /api/integrations/:id -> Remove key
  if (req.method === "DELETE") {
    runtimeKeys.delete(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ detail: "Method not allowed" });
}
