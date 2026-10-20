import type { VercelRequest, VercelResponse } from "./_lib/types";
import { setCorsHeaders } from "./_lib/config";
import { fetchWeather } from "./_lib/weather";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const { lat, lon, units, name } = req.query;

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
    const data = await fetchWeather({
      lat: latitude,
      lon: longitude,
      units: unitType,
      name: locationName,
    });
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(502).json({ detail: err.message || "Failed to fetch weather data" });
  }
}
