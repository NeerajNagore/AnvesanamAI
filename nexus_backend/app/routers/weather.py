from typing import Literal

from fastapi import APIRouter, Query

from ..services import weather

router = APIRouter()


@router.get("/weather")
async def get_weather(
    lat: float = Query(ge=-90, le=90),
    lon: float = Query(ge=-180, le=180),
    units: Literal["metric", "imperial"] = "metric",
    name: str = Query("Unknown", max_length=100),
):
    return await weather.fetch(lat, lon, units, name)
