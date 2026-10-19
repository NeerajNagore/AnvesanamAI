import hashlib
from urllib.parse import urlparse

import httpx

from ..errors import ServiceError
from ..store import get_key

URL = "https://api.tavily.com/search"


async def search(query: str, max_results: int = 5, depth: str = "basic", topic: str = "general") -> list[dict]:
    key = get_key("tavily")
    if not key:
        raise ServiceError("Web search is not configured. Add a Tavily key on the Integrations page.", 503)
    payload = {"query": query[:400], "max_results": max_results, "search_depth": depth, "topic": topic}
    try:
        async with httpx.AsyncClient(timeout=40) as c:
            r = await c.post(URL, json=payload, headers={"Authorization": f"Bearer {key}"})
    except httpx.HTTPError:
        raise ServiceError("Could not reach the search provider.")
    if r.status_code in (401, 403):
        raise ServiceError("Tavily rejected the API key.", 502)
    if r.status_code == 429:
        raise ServiceError("Search rate limit reached. Try again shortly.", 429)
    if r.status_code >= 400:
        raise ServiceError("The search provider returned an error.")
    return r.json().get("results", [])


def to_sources(results: list[dict], start_id: int = 1, snippet_len: int = 300) -> list[dict]:
    seen, out = set(), []
    for res in results:
        url = res.get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        domain = urlparse(url).netloc.removeprefix("www.")
        item = {
            "id": start_id + len(out),
            "title": (res.get("title") or domain)[:200],
            "url": url,
            "domain": domain,
            "snippet": (res.get("content") or "")[:snippet_len],
            "_content": (res.get("content") or "")[:1500],  # internal: used in prompts, stripped before sending
        }
        if res.get("published_date"):
            item["publishedAt"] = res["published_date"]
        out.append(item)
    return out


def public(sources: list[dict]) -> list[dict]:
    return [{k: v for k, v in s.items() if not k.startswith("_")} for s in sources]


def sources_block(sources: list[dict]) -> str:
    return "\n\n".join(f"[{s['id']}] {s['title']} ({s['domain']})\n{s['_content']}" for s in sources)


def uid(text: str) -> str:
    return hashlib.sha1(text.encode()).hexdigest()[:12]
