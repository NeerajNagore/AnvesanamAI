export interface FetchWeatherParams {
  lat: number;
  lon: number;
  units?: "metric" | "imperial";
  name?: string;
}

export async function fetchWeather({ lat, lon, units = "metric", name = "Unknown" }: FetchWeatherParams) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
    temperature_unit: units === "metric" ? "celsius" : "fahrenheit",
    wind_speed_unit: units === "metric" ? "kmh" : "mph",
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Weather service responded with status ${response.status}`);
  }

  const d = await response.json();
  const cur = d.current;
  const hr = d.hourly;
  const dy = d.daily;

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

  return {
    location: {
      name,
      latitude: lat,
      longitude: lon,
      timezone: d.timezone || "UTC",
    },
    units,
    current: {
      temperature: Math.round(cur.temperature_2m),
      apparent: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      windSpeed: Math.round(cur.wind_speed_10m),
      pressure: Math.round(cur.pressure_msl),
      precipitation: cur.precipitation,
      code: cur.weather_code,
      isDay: cur.is_day === 1,
      time: cur.time,
    },
    hourly,
    daily,
    demo: false,
    fetchedAt: new Date().toISOString(),
  };
}
