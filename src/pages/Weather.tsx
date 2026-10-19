import { useEffect, useRef, useState } from "react";
import { Droplets, Gauge, LocateFixed, MapPin, Pin, Search, Sun, Sunrise, Sunset, Thermometer, Wind, X, type LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { DemoBadge, ErrorState, PageHeader, Spinner } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented, Skeleton } from "@/components/ui/misc";
import { useApp } from "@/context/AppContext";
import { useAsync, useDebounce } from "@/hooks/useAsync";
import { getDemoWeather, getWeather, searchCities } from "@/lib/api";
import { speedUnit, tempUnit, weatherMeta } from "@/lib/weather";
import { cn, errorMessage } from "@/lib/utils";
import type { GeoLocation } from "@/types";

const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric" });
const dayLabel = (iso: string, i: number) => (i === 0 ? "Today" : new Date(iso + "T12:00").toLocaleDateString([], { weekday: "short" }));
const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function Weather() {
  const { settings, updateSettings, toast } = useApp();
  const [location, setLocation] = useState<GeoLocation>(settings.location);
  const units = settings.units;
  const { data, loading, error, reload, setData } = useAsync((s) => getWeather(location, units, s), [location.latitude, location.longitude, units]);

  // City search
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounced = useDebounce(term, 350);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    setSearchError("");
    searchCities(debounced, ctrl.signal)
      .then((r) => !ctrl.signal.aborted && setResults(r))
      .catch((e: unknown) => !ctrl.signal.aborted && setSearchError(errorMessage(e)))
      .finally(() => !ctrl.signal.aborted && setSearching(false));
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setResults([]);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (loc: GeoLocation) => {
    setLocation(loc);
    setTerm("");
    setResults([]);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast("Geolocation isn't supported in this browser.", "error");
    navigator.geolocation.getCurrentPosition(
      (p) => choose({ name: "My location", latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => toast("Couldn't get your location. Check your browser permissions.", "error"),
      { timeout: 10000 },
    );
  };

  const isSaved = settings.savedCities.some((c) => c.latitude === location.latitude && c.longitude === location.longitude);
  const isDefault = settings.location.latitude === location.latitude && settings.location.longitude === location.longitude;

  const toggleSaved = () => {
    updateSettings({
      savedCities: isSaved
        ? settings.savedCities.filter((c) => !(c.latitude === location.latitude && c.longitude === location.longitude))
        : [...settings.savedCities, location].slice(-8),
    });
  };

  const meta = data ? weatherMeta(data.current.code, data.current.isDay) : null;
  const today = data?.daily[0];

  const details: { label: string; value: string; Icon: LucideIcon }[] = data
    ? [
        { label: "Feels like", value: `${data.current.apparent}${tempUnit(units)}`, Icon: Thermometer },
        { label: "Humidity", value: `${data.current.humidity}%`, Icon: Droplets },
        { label: "Wind", value: `${data.current.windSpeed} ${speedUnit(units)}`, Icon: Wind },
        { label: "Pressure", value: `${data.current.pressure} hPa`, Icon: Gauge },
        { label: "UV index (max)", value: String(today?.uv ?? "–"), Icon: Sun },
        { label: "Sunrise", value: today ? clock(today.sunrise) : "–", Icon: Sunrise },
        { label: "Sunset", value: today ? clock(today.sunset) : "–", Icon: Sunset },
        { label: "Precipitation", value: `${data.current.precipitation} mm`, Icon: Droplets },
      ]
    : [];

  return (
    <PageContainer>
      <PageHeader
        title="Weather"
        description="Live conditions and a 7-day forecast."
        actions={
          <Segmented
            ariaLabel="Units"
            value={units}
            onChange={(u) => updateSettings({ units: u })}
            options={[{ value: "metric", label: "°C" }, { value: "imperial", label: "°F" }]}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search for a city…" className="pl-9 pr-9" aria-label="Search city" />
          {searching && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />}
          {(results.length > 0 || searchError) && (
            <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-popover p-1 shadow-2xl scrollbar-thin" role="listbox">
              {searchError && <li className="px-3 py-2 text-sm text-destructive">{searchError}</li>}
              {results.map((r) => (
                <li key={`${r.latitude},${r.longitude}`}>
                  <button onClick={() => choose(r)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent" role="option" aria-selected={false}>
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{r.name}</span>
                    {r.country && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{r.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="outline" onClick={useMyLocation}><LocateFixed className="h-4 w-4" /> Use my location</Button>
      </div>

      {settings.savedCities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[settings.location, ...settings.savedCities.filter((c) => c.latitude !== settings.location.latitude)].map((c) => {
            const on = c.latitude === location.latitude && c.longitude === location.longitude;
            return (
              <button key={`${c.latitude},${c.longitude}`} onClick={() => setLocation(c)} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", on ? "border-primary/50 bg-primary/15 text-primary" : "bg-card/60 text-muted-foreground hover:text-foreground")}>
                <MapPin className="h-3 w-3" /> {c.name}
              </button>
            );
          })}
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-64 lg:col-span-1" /><Skeleton className="h-64 lg:col-span-2" /></div>
      )}

      {error && (
        <ErrorState message={error} onRetry={reload} extra={<Button size="sm" variant="ghost" onClick={() => setData(getDemoWeather(location, units))}>Show demo data</Button>} />
      )}

      {data && meta && !error && (
        <div className={cn("space-y-6 transition-opacity", loading && "opacity-60")}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{data.location.name}{data.location.country ? `, ${data.location.country}` : ""}</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(data.current.time).toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleSaved} aria-label={isSaved ? "Remove from saved cities" : "Save city"} title={isSaved ? "Remove from saved" : "Save city"}>
                      {isSaved ? <X className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-6xl font-bold tracking-tight">{data.current.temperature}<span className="text-3xl text-muted-foreground">{tempUnit(units)}</span></p>
                    <p className="mt-2 text-base font-medium">{meta.label}</p>
                    {today && <p className="text-sm text-muted-foreground">H {today.max}° · L {today.min}°</p>}
                  </div>
                  <meta.Icon className="h-20 w-20 animate-float text-primary" />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {data.demo && <DemoBadge />}
                  {!isDefault && <Button size="sm" variant="outline" onClick={() => { updateSettings({ location }); toast(`${location.name} set as your default city`, "success"); }}>Set as default</Button>}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3"><CardTitle>Conditions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {details.map(({ label, value, Icon }) => (
                    <div key={label} className="rounded-xl bg-muted/50 p-3">
                      <Icon className="mb-2 h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-0.5 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle>Next 24 hours</CardTitle></CardHeader>
            <CardContent>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-thin">
                {data.hourly.map((h, i) => {
                  const m = weatherMeta(h.code, h.isDay);
                  return (
                    <div key={h.time} className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-xl bg-muted/40 px-2 py-3 text-center">
                      <span className="text-xs text-muted-foreground">{i === 0 ? "Now" : hourLabel(h.time)}</span>
                      <m.Icon className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold">{h.temperature}°</span>
                      <span className="text-[10px] text-blue-400">{h.precipProb}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle>7-day forecast</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {data.daily.map((d, i) => {
                const m = weatherMeta(d.code, true);
                const span = Math.max(...data.daily.map((x) => x.max)) - Math.min(...data.daily.map((x) => x.min)) || 1;
                const lo = Math.min(...data.daily.map((x) => x.min));
                return (
                  <div key={d.date} className="grid grid-cols-[3.5rem_1.5rem_1fr] items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/40 sm:grid-cols-[4rem_1.5rem_8rem_1fr_3rem]">
                    <span className="text-sm font-medium">{dayLabel(d.date, i)}</span>
                    <m.Icon className="h-5 w-5 text-primary" aria-label={m.label} />
                    <span className="hidden text-sm text-muted-foreground sm:block">{m.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-right text-sm text-muted-foreground">{d.min}°</span>
                      <div className="relative h-1.5 flex-1 rounded-full bg-muted">
                        <div className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ left: `${((d.min - lo) / span) * 100}%`, width: `${Math.max(8, ((d.max - d.min) / span) * 100)}%` }} />
                      </div>
                      <span className="w-8 text-sm font-semibold">{d.max}°</span>
                    </div>
                    <span className="hidden text-right text-xs text-blue-400 sm:block">{d.precipProb}%</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">Weather data by Open-Meteo.com · updated {new Date(data.fetchedAt).toLocaleTimeString()}</p>
        </div>
      )}
    </PageContainer>
  );
}
