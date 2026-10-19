import { ExternalLink } from "lucide-react";
import type { Source } from "@/types";
import { cn, timeAgo } from "@/lib/utils";

export function SourceCard({ source, className }: { source: Source; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group flex gap-3 rounded-xl border bg-background/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/60", className)}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{source.id}</span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 text-sm font-medium group-hover:text-primary">{source.title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{source.snippet}</span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{source.domain}</span>
          {source.publishedAt && <span>· {timeAgo(source.publishedAt)}</span>}
          <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </span>
    </a>
  );
}
