import { Fragment, type ReactNode } from "react";
import type { Source } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  sources?: Source[];
  showCitations?: boolean;
  streaming?: boolean;
  className?: string;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\]|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;

function inline(text: string, sources: Source[] | undefined, showCitations: boolean, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    const cite = /^\[(\d+)\]$/.exec(part);
    if (cite) {
      if (!showCitations) return null;
      const n = Number(cite[1]);
      const src = sources?.find((s) => s.id === n);
      const chip = (
        <span className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded-md bg-primary/20 px-1 text-[10px] font-semibold text-primary">
          {n}
        </span>
      );
      return src ? (
        <a key={key} href={src.url} target="_blank" rel="noopener noreferrer" title={src.title} className="hover:opacity-80">
          {chip}
        </a>
      ) : (
        <Fragment key={key}>{chip}</Fragment>
      );
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (link)
      return (
        <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
          {link[1]}
        </a>
      );
    return <Fragment key={key}>{part}</Fragment>;
  });
}

/** Tiny, dependency-free Markdown subset renderer (headings, lists, bold, code, links, callouts, citations). No raw HTML is ever injected. */
export function RichText({ text, sources, showCitations = true, streaming, className }: Props) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let b = 0;

  while (i < lines.length) {
    const line = lines[i];
    const k = `b${b++}`;

    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={k} className="overflow-x-auto rounded-xl border bg-muted/60 p-3 font-mono text-xs scrollbar-thin">
          {code.join("\n")}
        </pre>,
      );
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push(
        <h4 key={k} className={cn("font-semibold tracking-tight text-foreground", h[1].length === 1 ? "text-xl" : h[1].length === 2 ? "pt-2 text-base" : "text-sm")}>
          {inline(h[2], sources, showCitations, k)}
        </h4>,
      );
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <div key={k} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-300">
          {inline(q.join(" "), sources, showCitations, k)}
        </div>,
      );
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(
        <ul key={k} className="list-disc space-y-1.5 pl-5 marker:text-primary/70">
          {items.map((it, j) => (
            <li key={j}>{inline(it, sources, showCitations, `${k}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push(
        <ol key={k} className="list-decimal space-y-1.5 pl-5 marker:text-primary/70">
          {items.map((it, j) => (
            <li key={j}>{inline(it, sources, showCitations, `${k}-${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|```|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k}>{inline(para.join(" "), sources, showCitations, k)}</p>);
  }

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-foreground/90", className)}>
      {blocks}
      {streaming && <span className="inline-block h-4 w-1.5 translate-y-0.5 animate-blink rounded-sm bg-primary" aria-hidden />}
    </div>
  );
}
