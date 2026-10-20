import { getKey, GROQ_MODEL, LANGUAGES } from "./config";

function getGroqConfig() {
  const key = getKey("grok");
  if (!key) {
    throw new Error("Language model is not configured. Add your Groq API key on the Integrations page.");
  }
  return {
    key,
    baseUrl: "https://api.groq.com/openai/v1",
    model: GROQ_MODEL,
  };
}

export async function* streamGroqChat(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.4
): AsyncGenerator<string, void, unknown> {
  const { key, baseUrl, model } = getGroqConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Groq rejected the API key. Please check your key on the Integrations page.");
  }
  if (response.status === 429) {
    throw new Error("Groq rate limit reached. Please try again shortly.");
  }
  if (!response.ok || !response.body) {
    throw new Error(`Groq API returned an error (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") return;

      try {
        const json = JSON.parse(dataStr);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      } catch {
        /* ignore parse errors in stream frames */
      }
    }
  }
}

export async function groqJsonCompletion(
  system: string,
  user: string,
  maxTokens: number = 2000,
  temperature: number = 0.3
): Promise<any> {
  const { key, baseUrl, model } = getGroqConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("Groq rejected the API key.");
  }
  if (response.status === 429) {
    throw new Error("Groq rate limit reached.");
  }
  if (!response.ok) {
    throw new Error(`Groq API error (${response.status}).`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function generateFollowups(
  question: string,
  answer: string,
  lang: string
): Promise<string[]> {
  try {
    const langName = LANGUAGES[lang] || "English";
    const data = await groqJsonCompletion(
      `Suggest 3 short, relevant follow-up questions in ${langName}. Respond with JSON only: {"items": ["...", "...", "..."]}`,
      `Question: ${question.slice(0, 500)}\n\nAnswer: ${answer.slice(0, 1500)}`,
      200,
      0.7
    );
    const items = data.items;
    if (Array.isArray(items)) {
      return items.map((i: any) => String(i).slice(0, 140)).slice(0, 3);
    }
  } catch {
    /* non-fatal */
  }
  return [];
}
