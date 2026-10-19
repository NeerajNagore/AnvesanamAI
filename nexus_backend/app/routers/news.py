from fastapi import APIRouter, Query

from ..services import news

router = APIRouter()


@router.get("/news")
async def get_news(category: str = Query("all", max_length=30), q: str = Query("", max_length=200)):
    return {"articles": await news.fetch(category, q)}
