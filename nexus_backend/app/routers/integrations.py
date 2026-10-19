import openai
import httpx
from fastapi import APIRouter

from ..errors import ServiceError
from ..schemas import IntegrationId, KeyBody
from ..services import llm, news, tavily, weather
from ..store import delete_key, get_key, set_key, source_of

router = APIRouter()
KEYED = ("grok", "tavily", "newsapi")


def status(i: str) -> dict:
    if i == "weather":
        return {"id": "weather", "configured": True, "message": "Using Open-Meteo (free, no key required)."}
    src = source_of(i)
    msg = {"env": "Key loaded from the server environment.", "ui": "Key stored on the server."}.get(src)
    return {"id": i, "configured": src is not None, **({"message": msg} if msg else {})}


@router.get("/integrations")
async def list_integrations():
    return {"integrations": [status(i) for i in (*KEYED, "weather")]}


@router.put("/integrations/{integration_id}")
async def save_key(integration_id: IntegrationId, body: KeyBody):
    if integration_id == "weather":
        raise ServiceError("Weather uses a free provider and needs no key.", 400)
    key = body.apiKey.strip()
    if any(c.isspace() for c in key):
        raise ServiceError("The key must not contain spaces or line breaks.", 400)
    set_key(integration_id, key)
    return {"ok": True}


@router.delete("/integrations/{integration_id}")
async def remove_key(integration_id: IntegrationId):
    if integration_id == "weather":
        raise ServiceError("Weather needs no key, so there is nothing to remove.", 400)
    delete_key(integration_id)
    return {"ok": True}


@router.post("/integrations/{integration_id}/test")
async def test_key(integration_id: IntegrationId):
    if integration_id != "weather" and not get_key(integration_id):
        return {"ok": False, "message": "No key configured."}
    try:
        if integration_id == "grok":
            await llm.client().models.list()
        elif integration_id == "openai":
            await llm.client().models.list()
        elif integration_id == "tavily":
            await tavily.search("test", max_results=1)
        elif integration_id == "newsapi":
            await news.fetch("technology", "", page_size=1)
        else:
            await weather.fetch(18.52, 73.86, "metric", "Test")
    except ServiceError as e:
        return {"ok": False, "message": e.message}
    except openai.AuthenticationError:
        return {"ok": False, "message": "xAI rejected the API key."}
    except (openai.APIError, httpx.HTTPError):
        return {"ok": False, "message": "Could not reach the provider."}
    return {"ok": True, "message": "Connection successful."}
