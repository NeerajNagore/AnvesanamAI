"""News service — uses GNews (free, no key needed for basic use) with Tavily fallback."""
import httpx

from ..config import NEWS_COUNTRY
from ..errors import ServiceError
from ..store import get_key
from .tavily import uid

BASE_NEWSAPI = "https://newsapi.org/v2"
CATEGORY_TO_NEWSAPI = {"world": "general"}
VALID = {"technology", "business", "science", "health", "sports", "world", "entertainment"}

# GNews free endpoint — no API key required for basic calls
GNEWS_BASE = "https://gnews.io/api/v4"
GNEWS_COUNTRY = "in"   # India
GNEWS_CATEGORY_MAP = {
    "technology": "technology",
    "business": "business",
    "science": "science",
    "health": "health",
    "sports": "sports",
    "world": "world",
    "entertainment": "entertainment",
    "all": "general",
}

# Tavily topic=news query map per category
CATEGORY_QUERIES = {
    "technology": "latest technology news",
    "business": "latest business news",
    "science": "latest science news",
    "health": "latest health news",
    "sports": "latest sports news",
    "world": "latest world news",
    "entertainment": "latest entertainment news",
    "all": "latest news today",
}


async def _fetch_via_gnews(category: str, q: str, page_size: int) -> list[dict]:
    """Fetch news using GNews API (free tier, no key required for up to 10 results)."""
    gnews_key = get_key("newsapi")  # reuse newsapi slot for gnews key if set
    cat_slug = GNEWS_CATEGORY_MAP.get(category, "general")
    cat = category if category in VALID else "world"

    if q.strip():
        url = f"{GNEWS_BASE}/search"
        params = {
            "q": q.strip()[:200],
            "lang": "en",
            "max": min(page_size, 10),
            "sortby": "publishedAt",
        }
    else:
        url = f"{GNEWS_BASE}/top-headlines"
        params = {
            "category": cat_slug,
            "lang": "en",
            "country": GNEWS_COUNTRY,
            "max": min(page_size, 10),
        }

    if gnews_key:
        params["apikey"] = gnews_key

    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(url, params=params)
    except httpx.HTTPError:
        raise ServiceError("Could not reach the news provider.")

    if r.status_code in (401, 403):
        raise ServiceError("GNews rejected the API key. Please check the key on the Integrations page.", 502)
    if r.status_code == 429:
        raise ServiceError("News rate limit reached. Try again later.", 429)
    if r.status_code >= 400:
        raise ServiceError(f"The news provider returned an error ({r.status_code}).")

    out = []
    for a in r.json().get("articles", []):
        url_val = a.get("url")
        title = a.get("title")
        if not url_val or not title or title == "[Removed]":
            continue
        out.append(
            {
                "id": uid(url_val),
                "title": title,
                "summary": a.get("description") or (a.get("content") or "")[:240],
                "url": url_val,
                "source": (a.get("source") or {}).get("name") or "Unknown",
                "category": cat,
                "publishedAt": a.get("publishedAt") or "",
                **({
                    "imageUrl": a["image"]
                } if a.get("image") else {}),
            }
        )
    return out


async def _fetch_via_tavily(category: str, q: str, page_size: int) -> list[dict]:
    """Fetch news using Tavily topic=news search."""
    from .tavily import search as tavily_search

    query = q.strip() or CATEGORY_QUERIES.get(category, "latest news today")
    results = await tavily_search(query, max_results=min(page_size, 10), depth="basic", topic="news")

    cat = category if category in VALID else "world"
    out = []
    for r in results:
        url = r.get("url")
        title = r.get("title")
        if not url or not title or title == "[Removed]":
            continue
        src = r.get("source", "Unknown")
        out.append(
            {
                "id": uid(url),
                "title": title,
                "summary": (r.get("content") or "")[:240],
                "url": url,
                "source": src if isinstance(src, str) else (src or {}).get("name", "Unknown"),
                "category": cat,
                "publishedAt": r.get("published_date") or "",
            }
        )
    return out


async def _fetch_via_newsapi(category: str, q: str, page_size: int) -> list[dict]:
    """Fetch news using NewsAPI.org (requires NEWSAPI_KEY)."""
    key = get_key("newsapi")
    q = q.strip()[:200]
    if q:
        url = f"{BASE_NEWSAPI}/everything"
        params = {"q": q, "sortBy": "publishedAt", "language": "en", "pageSize": page_size}
    else:
        url = f"{BASE_NEWSAPI}/top-headlines"
        params = {"country": NEWS_COUNTRY, "pageSize": page_size}
        if category in VALID:
            params["category"] = CATEGORY_TO_NEWSAPI.get(category, category)
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(url, params=params, headers={"X-Api-Key": key})
    except httpx.HTTPError:
        raise ServiceError("Could not reach the news provider.")
    if r.status_code in (401, 403):
        raise ServiceError("NewsAPI rejected the API key.", 502)
    if r.status_code == 429:
        raise ServiceError("News rate limit reached. Try again later.", 429)
    if r.status_code >= 400:
        raise ServiceError("The news provider returned an error.")

    cat = category if category in VALID else "world"
    out = []
    for a in r.json().get("articles", []):
        if not a.get("url") or not a.get("title") or a["title"] == "[Removed]":
            continue
        out.append(
            {
                "id": uid(a["url"]),
                "title": a["title"],
                "summary": a.get("description") or (a.get("content") or "")[:240],
                "url": a["url"],
                "source": (a.get("source") or {}).get("name") or "Unknown",
                "category": cat,
                "publishedAt": a.get("publishedAt") or "",
                **({"imageUrl": a["urlToImage"]} if a.get("urlToImage") else {}),
            }
        )
    return out


async def fetch(category: str, q: str, page_size: int = 24) -> list[dict]:
    """Fetch news.

    Priority:
      1. GNews (free, no key required for 10 results/day, or use NEWSAPI slot for GNews key)
      2. Tavily topic=news (if GNews fails and Tavily key is set)
      3. ServiceError
    """
    try:
        return await _fetch_via_gnews(category, q, page_size)
    except ServiceError as e:
        if e.status == 503:
            raise  # no connectivity
        # If newsapi key is configured, also try newsapi.org
        if get_key("newsapi"):
            try:
                return await _fetch_via_newsapi(category, q, page_size)
            except ServiceError:
                pass
        # GNews failed (rate limit / bad key) → try Tavily
        tavily_key = get_key("tavily")
        if tavily_key:
            try:
                return await _fetch_via_tavily(category, q, page_size)
            except ServiceError:
                pass
        raise
