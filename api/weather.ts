export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const { lat, lon, units, name } = req.query || {};

  if (!lat || !lon) {
    return res.status(422).json({ detail: "Missing latitude or longitude parameters" });
  }

  const latitude = parseFloat(Array.isArray(lat) ? lat[0] : lat);
  const longitude = parseFloat(Array.isArray(lon) ? lon[0] : lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(422).json({ detail: "Invalid latitude or longitude numbers" });
  }

  const unitType = (Array.isArray(units) ? units[0] : units) === "imperial" ? "imperial" : "metric";
  const locationName = (Array.isArray(name) ? name[0] : name) || "Unknown";

  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl",
      hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
      timezone: "auto",
      forecast_days: "7",
      temperature_unit: unitType === "metric" ? "celsius" : "fahrenheit",
      wind_speed_unit: unitType === "metric" ? "kmh" : "mph",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      return res.status(502).json({ detail: "Weather service unavailable" });
    }

    const d = await response.json();
    const cur = d.current || {};
    const hr = d.hourly || {};
    const dy = d.daily || {};

    const prefix = (cur.time || "").slice(0, 13);
    const hrTimes: string[] = hr.time || [];
    let startIdx = hrTimes.findIndex((t: string) => t >= prefix);
    if (startIdx < 0) startIdx = 0;

    const hourly = [];
    const endIdx = Math.min(startIdx + 24, hrTimes.length);
    for (let i = startIdx; i < endIdx; i++) {
      hourly.push({
        time: hrTimes[i],
        temperature: Math.round(hr.temperature_2m[i]),
        code: hr.weather_code[i],
        precipProb: hr.precipitation_probability[i] || 0,
        isDay: hr.is_day[i] === 1,
      });
    }

    const daily = [];
    const dyTimes: string[] = dy.time || [];
    for (let i = 0; i < dyTimes.length; i++) {
      daily.push({
        date: dyTimes[i],
        max: Math.round(dy.temperature_2m_max[i]),
        min: Math.round(dy.temperature_2m_min[i]),
        code: dy.weather_code[i],
        precipProb: dy.precipitation_probability_max[i] || 0,
        sunrise: dy.sunrise[i],
        sunset: dy.sunset[i],
        uv: Math.round(dy.uv_index_max[i] || 0),
      });
    }

    return res.status(200).json({
      location: {
        name: locationName,
        latitude,
        longitude,
        timezone: d.timezone || "UTC",
      },
      units: unitType,
      current: {
        temperature: Math.round(cur.temperature_2m ?? 20),
        apparent: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 20),
        humidity: cur.relative_humidity_2m ?? 50,
        windSpeed: Math.round(cur.wind_speed_10m ?? 5),
        pressure: Math.round(cur.pressure_msl ?? 1013),
        precipitation: cur.precipitation ?? 0,
        code: cur.weather_code ?? 0,
        isDay: cur.is_day === 1,
        time: cur.time || new Date().toISOString(),
      },
      hourly,
      daily,
      demo: false,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(502).json({ detail: err.message || "Failed to fetch weather data" });
  }
}
