import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";

/** Maps WMO weather codes (used by Open-Meteo) to a label and icon. */
export function weatherMeta(code: number, isDay = true): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", Icon: isDay ? Sun : Moon };
  if (code === 1) return { label: "Mainly clear", Icon: isDay ? Sun : Moon };
  if (code === 2) return { label: "Partly cloudy", Icon: isDay ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: Snowflake };
  if (code >= 80 && code <= 82) return { label: "Rain showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Unknown", Icon: Cloud };
}

export const tempUnit = (units: "metric" | "imperial") => (units === "metric" ? "°C" : "°F");
export const speedUnit = (units: "metric" | "imperial") => (units === "metric" ? "km/h" : "mph");
