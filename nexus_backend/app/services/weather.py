from datetime import datetime, timezone

import httpx

from ..errors import ServiceError

URL = "https://api.open-meteo.com/v1/forecast"


async def fetch(lat: float, lon: float, units: str, name: str) -> dict:
    p = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl",
        "hourly": "temperature_2m,weather_code,precipitation_probability,is_day",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
        "timezone": "auto",
        "forecast_days": 7,
        "temperature_unit": "celsius" if units == "metric" else "fahrenheit",
        "wind_speed_unit": "kmh" if units == "metric" else "mph",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(URL, params=p)
        r.raise_for_status()
    except httpx.HTTPError:
        raise ServiceError("The weather service is unavailable right now.")
    d = r.json()
    cur, hr, dy = d["current"], d["hourly"], d["daily"]

    prefix = cur["time"][:13]
    start = next((i for i, t in enumerate(hr["time"]) if t >= prefix), 0)
    hourly = [
        {
            "time": hr["time"][i],
            "temperature": round(hr["temperature_2m"][i]),
            "code": hr["weather_code"][i],
            "precipProb": hr["precipitation_probability"][i] or 0,
            "isDay": hr["is_day"][i] == 1,
        }
        for i in range(start, min(start + 24, len(hr["time"])))
    ]
    daily = [
        {
            "date": dy["time"][i],
            "max": round(dy["temperature_2m_max"][i]),
            "min": round(dy["temperature_2m_min"][i]),
            "code": dy["weather_code"][i],
            "precipProb": dy["precipitation_probability_max"][i] or 0,
            "sunrise": dy["sunrise"][i],
            "sunset": dy["sunset"][i],
            "uv": round(dy["uv_index_max"][i] or 0),
        }
        for i in range(len(dy["time"]))
    ]
    return {
        "location": {"name": name, "latitude": lat, "longitude": lon, "timezone": d.get("timezone", "UTC")},
        "units": units,
        "current": {
            "temperature": round(cur["temperature_2m"]),
            "apparent": round(cur["apparent_temperature"]),
            "humidity": cur["relative_humidity_2m"],
            "windSpeed": round(cur["wind_speed_10m"]),
            "pressure": round(cur["pressure_msl"]),
            "precipitation": cur["precipitation"],
            "code": cur["weather_code"],
            "isDay": cur["is_day"] == 1,
            "time": cur["time"],
        },
        "hourly": hourly,
        "daily": daily,
        "demo": False,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }
