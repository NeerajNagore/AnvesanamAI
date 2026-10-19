import { useState } from "react";
import { ExternalLink, ImageOff, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { NewsArticle } from "@/types";
import { Skeleton } from "@/components/ui/misc";
import { categoryMeta } from "@/lib/news-meta";
import { cn, timeAgo } from "@/lib/utils";

/* ── Thumbnail with graceful fallback ───────────────────────── */
function Thumbnail({ src, alt, gradient }: { src?: string; alt: string; gradient: string }) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setErr(true)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", gradient)}>
      <ImageOff className="h-6 w-6 opacity-40" />
    </div>
  );
}

/* ── Main card ──────────────────────────────────────────────── */
export function NewsCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const meta = categoryMeta(article.category);
  const prompt = `Give me a brief with background on this news story: "${article.title}"`;

  /* compact variant — used on the Dashboard */
  if (compact) {
    return (
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent/60"
      >
        {/* tiny square thumb */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          <Thumbnail src={article.imageUrl} alt={article.title} gradient={meta.gradient} />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
            {article.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {article.source} · {timeAgo(article.publishedAt)}
          </p>
        </div>
      </a>
    );
  }

  /* full card */
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
      {/* ── thumbnail area ── */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block h-44 w-full overflow-hidden"
        tabIndex={-1}
        aria-hidden
      >
        <Thumbnail src={article.imageUrl} alt={article.title} gradient={meta.gradient} />

        {/* category badge pinned top-right */}
        <span
          className={cn(
            "absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize backdrop-blur-sm",
            "bg-black/40 text-white ring-1 ring-white/10",
          )}
        >
          <meta.Icon className="h-3 w-3" />
          {article.category}
        </span>
      </a>

      {/* ── body ── */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* clickable headline */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group/title"
        >
          <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover/title:text-primary">
            {article.title}
          </h3>
        </a>

        {article.summary && (
          <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{article.summary}</p>
        )}

        {/* ── footer ── */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          {/* source + time */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-muted-foreground">
              {article.source.charAt(0)}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {article.source}
            </span>
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(article.publishedAt)}</span>
          </div>

          {/* actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to="/chat"
              state={{ prompt }}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              title="Ask ANVEṢAṆAM AI about this story"
            >
              <Sparkles className="h-3 w-3" />
              Ask AI
            </Link>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={`Open ${article.title}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
export function NewsCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card/70">
      {/* image placeholder */}
      <Skeleton className="h-44 rounded-none" />
      <div className="space-y-2.5 p-4">
        {/* headline */}
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        {/* summary */}
        <Skeleton className="mt-1 h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        {/* footer */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
