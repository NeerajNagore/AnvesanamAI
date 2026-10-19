import json

from openai import AsyncOpenAI

from ..config import GROQ_MODEL
from ..errors import ServiceError
from ..store import get_key


def client() -> AsyncOpenAI:
    key = get_key("grok")
    if not key:
        raise ServiceError(
            "Grok is not configured. Add your xAI API key on the Integrations page.",
            503,
        )

    return AsyncOpenAI(
        api_key=key,
        base_url="https://api.groq.com/openai/v1",
        timeout=90,
        max_retries=1,
    )


async def json_completion(
    system: str,
    user: str,
    max_tokens: int = 2000,
    temperature: float = 0.3,
) -> dict:
    resp = await client().chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        max_tokens=max_tokens,
        temperature=temperature,
    )

    content = resp.choices[0].message.content or "{}"
    return json.loads(content)
