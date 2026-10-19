import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BookMarked, CloudSun, Droplets, Globe,
  MessageSquare, Newspaper, Plug, Radio, Search, Sparkles,
  TrendingUp, Wind, Zap,
} from "lucide-react";

import { DemoBadge, ErrorState } from "@/components/shared/common";
import { NewsFeedBg } from "@/components/shared/NewsFeedBg";
import { NewsCard } from "@/components/shared/NewsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { useApp } from "@/context/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { getNews, getWeather, getDemoWeather } from "@/lib/api";
import { SUGGESTED_PROMPTS } from "@/lib/demo";
import { greetingKey, t } from "@/lib/i18n";
import { speedUnit, tempUnit, weatherMeta } from "@/lib/weather";
import { cn } from "@/lib/utils";

// ── tiny live-dot animation ──────────────────────────────────────
function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
    </span>
  );
}

export default function Dashboard() {
  const { settings, reports } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"chat" | "research">("chat");

  const news    = useAsync((s) => getNews({ category: "all", q: "" }, s), []);
  const weather = useAsync(
    (s) => getWeather(settings.location, settings.units, s),
    [settings.location.latitude, settings.location.longitude, settings.units],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(mode === "chat" ? "/chat" : "/research", { state: { prompt: q } });
  };

  const go   = (prompt: string) => navigate("/chat", { state: { prompt } });
  const w    = weather.data;
  const meta = w ? weatherMeta(w.current.code, w.current.isDay) : null;
  const today = new Date().toLocaleDateString(settings.language, {
    weekday: "long", month: "long", day: "numeric",
  });

  const articles   = news.data?.articles ?? [];
  const featured   = articles[0] ?? null;
  const listItems  = articles.slice(1, 6);

  return (
    <div className="animate-fade-up space-y-0">

      {/* ═══════════════════════════════════════════════════════════
          HERO — dark navy editorial masthead
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 55%, #0f2060 100%)",
          minHeight: "340px",
        }}
      >
        {/* SVG background */}
        <NewsFeedBg />

        {/* bottom fade to page bg */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

          {/* Masthead top bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-blue-800/40 pb-4">
            {/* Live badge */}
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-400">
              <LiveDot />
              Live
            </span>
            <span className="text-sm text-blue-300/70">{today}</span>
            <span className="ml-auto hidden text-xs font-medium uppercase tracking-widest text-blue-400/60 sm:block">
              ANVEṢAṆAM&nbsp;AI&nbsp;Intelligence&nbsp;Platform
            </span>
          </div>

          {/* Two-column: headline + search */}
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">

            {/* LEFT — bold editorial headline */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                {t(settings.language, greetingKey())}, {settings.displayName}
              </p>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl xl:text-5xl">
                Discover Beyond<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#60a5fa,#a78bfa)" }}
                >
                  the Headlines.
                </span>
              </h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-blue-200/70">
                An intelligent platform to explore news, investigate stories, and uncover meaningful insights.
              </p>

              {/* Topic quick-links */}
              <div className="mt-5 flex flex-wrap gap-2">
                {["World", "Technology", "Markets", "Science", "Health"].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => go(`What's the latest news in ${topic}?`)}
                    className="rounded-full border border-blue-700/50 bg-blue-900/40 px-3 py-1 text-xs font-medium text-blue-300 transition-all hover:border-blue-400/70 hover:bg-blue-800/60 hover:text-white"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT — search bar */}
            <div>
              <form onSubmit={submit}>
                {/* Mode toggle — editorial tabs */}
                <div className="mb-3 flex gap-1 rounded-xl border border-blue-800/40 bg-blue-950/50 p-1 backdrop-blur-sm">
                  {(["chat", "research"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                        mode === m
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                          : "text-blue-400 hover:bg-blue-800/40 hover:text-white",
                      )}
                    >
                      {m === "chat"
                        ? <><MessageSquare className="h-3.5 w-3.5" /> Quick Answer</>
                        : <><Search className="h-3.5 w-3.5" /> Deep Research</>}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 rounded-xl border border-blue-700/50 bg-blue-950/70 p-2 shadow-2xl shadow-black/40 backdrop-blur-md focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20">
                  {mode === "chat"
                    ? <MessageSquare className="ml-2 h-5 w-5 shrink-0 text-blue-400/70" />
                    : <Search         className="ml-2 h-5 w-5 shrink-0 text-blue-400/70" />}
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t(settings.language, "askPlaceholder")}
                    className="h-11 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-blue-400/50"
                    aria-label="Search or ask ANVEṢAṆAM AI"
                  />
                  <Button
                    type="submit"
                    disabled={!query.trim()}
                    className="shrink-0 bg-blue-600 text-white shadow-lg shadow-blue-900/60 hover:bg-blue-500"
                  >
                    <span className="hidden sm:inline">{mode === "chat" ? "Ask" : "Research"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Stats strip */}
              <div className="mt-4 grid grid-cols-3 divide-x divide-blue-800/30 rounded-xl border border-blue-800/30 bg-blue-950/40 backdrop-blur-sm">
                {[
                  { label: "Saved Reports", value: reports.length, Icon: BookMarked, to: "/reports" },
                  { label: "Research Depth", value: settings.researchDepth, Icon: TrendingUp, to: "/settings", cap: true },
                  { label: "Integrations", value: "Manage", Icon: Plug, to: "/integrations" },
                ].map(({ label, value, Icon, to, cap }) => (
                  <Link
                    key={label}
                    to={to}
                    className="group flex flex-col items-center py-3 text-center transition-colors hover:bg-blue-800/20"
                  >
                    <Icon className="mb-1 h-4 w-4 text-blue-400 transition-colors group-hover:text-blue-300" />
                    <p className={cn("text-base font-bold text-white", cap && "capitalize")}>{value}</p>
                    <p className="text-[10px] text-blue-400/70">{label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT  (normal page padding resumes)
      ═══════════════════════════════════════════════════════════ */}
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Section header rule */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-red-500" />
            Latest Headlines
          </span>
          <div className="h-px flex-1 bg-border" />
          {news.data?.demo && <DemoBadge />}
          <Button asChild variant="ghost" size="sm">
            <Link to="/news">
              Full coverage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* ── News + Weather grid */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── News column (2/3) */}
          <div className="space-y-4 lg:col-span-2">

            {/* Loading */}
            {news.loading && (
              <>
                <Skeleton className="h-52 w-full rounded-2xl" />
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </>
            )}

            {/* Error */}
            {news.error && <ErrorState message={news.error} onRetry={news.reload} />}

            {/* Featured article — hero card */}
            {featured && (
              <a
                href={featured.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-2xl border bg-card/80 shadow-lg transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
              >
                {/* Category chip */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                    <Newspaper className="h-3 w-3" />
                    {featured.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {featured.source}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-primary sm:text-2xl">
                    {featured.title}
                  </h2>
                  {featured.summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {featured.summary}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {featured.source}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Read full story <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </a>
            )}

            {/* Remaining articles — compact editorial list */}
            {listItems.length > 0 && (
              <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border bg-card/70">
                {listItems.map((a) => (
                  <NewsCard key={a.id} article={a} compact />
                ))}
              </div>
            )}
          </div>

          {/* ── Right column: Weather + Suggested prompts */}
          <div className="space-y-5">

            {/* Weather card */}
            <div className="overflow-hidden rounded-2xl border bg-card/70">
              {/* header */}
              <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <CloudSun className="h-4 w-4 text-primary" /> Conditions
                </span>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  <Link to="/weather">Forecast <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
              <div className="p-4">
                {weather.loading && <Skeleton className="h-28" />}
                {weather.error && (
                  <ErrorState
                    message={weather.error}
                    onRetry={weather.reload}
                    extra={
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => weather.setData(getDemoWeather(settings.location, settings.units))}
                      >Use demo data</Button>
                    }
                  />
                )}
                {w && meta && (
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{w.location.name}</p>
                        <p className="mt-0.5 text-4xl font-black tracking-tight">
                          {w.current.temperature}{tempUnit(w.units)}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{meta.label}</p>
                      </div>
                      <meta.Icon className="h-12 w-12 text-primary" />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-muted/50 px-1 py-2">
                        <Droplets className="mx-auto mb-1 h-3.5 w-3.5 text-blue-400" />
                        {w.current.humidity}%
                      </div>
                      <div className="rounded-lg bg-muted/50 px-1 py-2">
                        <Wind className="mx-auto mb-1 h-3.5 w-3.5 text-purple-400" />
                        {w.current.windSpeed} {speedUnit(w.units)}
                      </div>
                      <div className="rounded-lg bg-muted/50 px-1 py-2">
                        <span className="block text-muted-foreground">Feels</span>
                        {w.current.apparent}°
                      </div>
                    </div>
                    {w.demo && <DemoBadge className="mt-3" />}
                  </div>
                )}
              </div>
            </div>

            {/* Ask AI section — editorial prompts panel */}
            <div className="overflow-hidden rounded-2xl border bg-card/70">
              <div className="border-b border-border/60 px-4 py-3">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-amber-400" /> Ask the AI
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                  <button
                    key={p.title}
                    onClick={() => go(p.prompt)}
                    className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60"
                  >
                    <span className="mt-0.5 shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      {p.tag}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug group-hover:text-primary">{p.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.prompt}</p>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </div>

            {/* Global coverage link */}
            <button
              onClick={() => go("Give me a summary of the biggest global news stories right now.")}
              className="group flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <Globe className="h-8 w-8 shrink-0 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold">Global Coverage</p>
                <p className="text-xs text-muted-foreground">AI summary of top world stories</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
            </button>
          </div>
        </div>

        {/* ── More prompts strip */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Research Topics
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.title}
                onClick={() => go(p.prompt)}
                className="group flex items-start gap-3 rounded-xl border bg-card/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{p.tag}</span>
                  <p className="mt-2 font-semibold leading-snug group-hover:text-primary">{p.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.prompt}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
