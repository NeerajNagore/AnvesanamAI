import { useMemo, useState } from "react";
import { Newspaper, RefreshCw, Search, X } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { DemoBadge, EmptyState, ErrorState, PageHeader } from "@/components/shared/common";
import { NewsCard, NewsCardSkeleton } from "@/components/shared/NewsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/misc";
import { useAsync, useDebounce } from "@/hooks/useAsync";
import { getNews } from "@/lib/api";
import { NEWS_CATEGORIES } from "@/lib/news-meta";
import { cn } from "@/lib/utils";

const PAGE = 9;

export default function News() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [visible, setVisible] = useState(PAGE);
  const q = useDebounce(search, 350);

  const { data, loading, error, reload } = useAsync((s) => getNews({ category, q }, s), [category, q]);

  const sources = useMemo(() => Array.from(new Set(data?.articles.map((a) => a.source) ?? [])).sort(), [data]);
  const articles = useMemo(() => {
    const list = (data?.articles ?? []).filter((a) => source === "all" || a.source === source);
    return list.sort((a, b) => (sort === "latest" ? 1 : -1) * (new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
  }, [data, source, sort]);

  const resetFilters = () => {
    setSearch("");
    setSource("all");
    setCategory("all");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Latest News"
        description="Browse headlines by category, search and filter."
        actions={<>{data?.demo && <DemoBadge />}<Button variant="outline" size="sm" onClick={reload} disabled={loading}><RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh</Button></>}
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0" role="tablist" aria-label="News categories">
        <div className="flex gap-2">
          {NEWS_CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={category === id}
              onClick={() => { setCategory(id); setVisible(PAGE); setSource("all"); }}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                category === id ? "border-transparent bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20" : "bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px_160px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PAGE); }} placeholder="Search headlines…" className="pl-9 pr-9" aria-label="Search news" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search"><X className="h-4 w-4" /></button>
          )}
        </div>
        <Select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "oldest")} aria-label="Sort order">
          <option value="latest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)}</div>
      ) : articles.length === 0 ? (
        <EmptyState icon={Newspaper} title="No stories found" description="Try a different category, source or search term." action={<Button variant="outline" onClick={resetFilters}>Reset filters</Button>} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{articles.length} {articles.length === 1 ? "story" : "stories"}</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {articles.slice(0, visible).map((a) => <NewsCard key={a.id} article={a} />)}
          </div>
          {visible < articles.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>Load more</Button>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
