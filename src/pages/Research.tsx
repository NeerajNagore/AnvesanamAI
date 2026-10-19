import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, FileSearch, Microscope, Search, Square } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { EmptyState, ErrorState, PageHeader, Spinner } from "@/components/shared/common";
import { DigitalGlobeBg } from "@/components/shared/DigitalGlobeBg";
import { ReportView } from "@/components/shared/ReportView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Segmented } from "@/components/ui/misc";
import { useApp } from "@/context/AppContext";
import { RESEARCH_STAGES, isAbort, runResearch } from "@/lib/api";
import { cn, errorMessage } from "@/lib/utils";
import type { ResearchDepth, ResearchReport } from "@/types";

const EXAMPLES = [
  "Impact of remote work on city economies",
  "Solid-state batteries: where is the technology today?",
  "Mediterranean diet: what does the evidence say?",
  "How do central bank rate decisions affect housing markets?",
];

export default function Research() {
  const { settings, saveReport, reports, toast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>(settings.researchDepth);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const handled = useRef(false);

  const start = async (q: string) => {
    const text = q.trim();
    if (!text || phase === "running") return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setQuery(text);
    setPhase("running");
    setStage(0);
    setError("");
    setReport(null);
    try {
      const r = await runResearch(
        { query: text, depth, maxSources: settings.maxSources, includeNews: settings.includeNews, language: settings.language },
        setStage,
        ctrl.signal,
      );
      setReport(r);
      setPhase("done");
      if (settings.autoSaveReports) {
        saveReport(r);
        toast("Report saved automatically", "success");
      }
    } catch (e) {
      if (isAbort(e)) {
        setPhase("idle");
      } else {
        setError(errorMessage(e));
        setPhase("error");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void start(query);
  };

  useEffect(() => {
    const prompt = (location.state as { prompt?: string } | null)?.prompt;
    if (prompt && !handled.current) {
      handled.current = true;
      navigate(location.pathname, { replace: true, state: null });
      void start(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <div className="relative">
      <DigitalGlobeBg className="opacity-60" />
      <PageContainer>
      <PageHeader title="Web Research" description="Search a topic, analyse the evidence and get a structured, cited report." />

      <Card>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to research?" className="h-12 pl-10 text-base" aria-label="Research topic" />
              </div>
              {phase === "running" ? (
                <Button type="button" size="lg" variant="secondary" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4 fill-current" /> Stop</Button>
              ) : (
                <Button type="submit" size="lg" disabled={!query.trim()}><Microscope className="h-4 w-4" /> Research</Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="space-y-1.5">
                <Label>Depth</Label>
                <Segmented
                  ariaLabel="Research depth"
                  value={depth}
                  onChange={setDepth}
                  options={[
                    { value: "quick", label: "Quick" },
                    { value: "standard", label: "Standard" },
                    { value: "deep", label: "Deep" },
                  ]}
                />
              </div>
              <p className="text-xs text-muted-foreground">Up to {settings.maxSources} sources{settings.includeNews ? " · recent news included" : ""}. Change defaults in Settings.</p>
            </div>
          </form>
        </CardContent>
      </Card>

      {phase === "idle" && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => void start(e)} className="rounded-full border bg-card/60 px-3.5 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-primary/10">{e}</button>
            ))}
          </div>
          <div className="mt-8">
            <EmptyState icon={FileSearch} title="No research yet" description="Enter a topic above. ANVEṢAṆAM AI will gather sources, analyse them and produce a report you can save or export." />
          </div>
        </div>
      )}

      {phase === "running" && (
        <Card>
          <CardContent className="space-y-3 p-6" role="status" aria-live="polite">
            <p className="font-semibold">Researching “{query}”…</p>
            <ol className="space-y-2.5">
              {RESEARCH_STAGES.map((label, i) => (
                <li key={label} className={cn("flex items-center gap-3 text-sm transition-opacity", i > stage && "opacity-40")}>
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", i < stage ? "bg-emerald-500/20 text-emerald-400" : i === stage ? "bg-primary/20 text-primary" : "bg-muted")}>
                    {i < stage ? <Check className="h-3.5 w-3.5" /> : i === stage ? <Spinner className="h-3 w-3" /> : <span className="text-xs">{i + 1}</span>}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500" style={{ width: `${((stage + 1) / RESEARCH_STAGES.length) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "error" && <ErrorState message={error} onRetry={() => void start(query)} />}

      {phase === "done" && report && (
        <ReportView report={report} saved={reports.some((r) => r.id === report.id)} onSave={() => { saveReport(report); toast("Report saved", "success"); }} />
      )}
      </PageContainer>
    </div>
  );
}
