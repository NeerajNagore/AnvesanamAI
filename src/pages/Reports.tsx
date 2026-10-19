import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookMarked, Download, FileText, Search, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { DemoBadge, EmptyState, PageHeader } from "@/components/shared/common";
import { ReportView } from "@/components/shared/ReportView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/misc";
import { useApp } from "@/context/AppContext";
import { downloadFile } from "@/lib/export";
import { formatDate, truncate } from "@/lib/utils";
import type { ResearchReport } from "@/types";

export default function Reports() {
  const { reports, deleteReport, toast } = useApp();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ResearchReport | null>(null);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = reports.filter((r) => !q || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q));
    return filtered.sort((a, b) =>
      sort === "title" ? a.title.localeCompare(b.title) : (sort === "newest" ? -1 : 1) * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    );
  }, [reports, search, sort]);

  const open = reports.find((r) => r.id === openId) ?? null;

  return (
    <PageContainer>
      <PageHeader
        title="Saved Reports"
        description="Your research and saved chat answers, stored in this browser."
        actions={
          reports.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => downloadFile("nexus-reports.json", JSON.stringify(reports, null, 2), "application/json")}>
              <Download className="h-3.5 w-3.5" /> Export all
            </Button>
          )
        }
      />

      {reports.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No saved reports yet"
          description="Run a web research task or save a chat answer, and it will appear here."
          action={<Button asChild><Link to="/research">Start researching</Link></Button>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="pl-9" aria-label="Search reports" />
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort reports">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </Select>
          </div>

          {list.length === 0 ? (
            <EmptyState icon={Search} title="No matching reports" description="Try a different search term." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((r) => (
                <article key={r.id} className="group flex flex-col rounded-2xl border bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>{formatDate(r.createdAt)}</span>
                    <Badge variant="secondary" className="ml-auto capitalize">{r.depth}</Badge>
                  </div>
                  <button onClick={() => setOpenId(r.id)} className="mt-3 text-left">
                    <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">{r.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{truncate(r.summary.replace(/[#>*`]/g, ""), 180)}</p>
                  </button>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{r.sources.length} sources</span>
                    {r.demo && <DemoBadge />}
                    <div className="ml-auto flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>View</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setToDelete(r)} aria-label={`Delete ${r.title}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{open?.title}</DialogTitle>
            <DialogDescription>Saved report</DialogDescription>
          </DialogHeader>
          {open && <ReportView report={open} saved />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this report?</DialogTitle>
            <DialogDescription>“{toDelete && truncate(toDelete.title, 70)}” will be removed from this browser. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (toDelete) deleteReport(toDelete.id);
                setToDelete(null);
                toast("Report deleted", "info");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
