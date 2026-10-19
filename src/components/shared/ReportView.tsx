import { Download, FileJson, FileText, Printer, Save } from "lucide-react";
import type { ResearchReport } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoBadge } from "./common";
import { RichText } from "./RichText";
import { SourceCard } from "./SourceCard";
import { downloadFile, printReport, reportToMarkdown, slugify } from "@/lib/export";
import { formatDate } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

interface Props {
  report: ResearchReport;
  saved: boolean;
  onSave?: () => void;
}

export function ReportView({ report, saved, onSave }: Props) {
  const { settings, toast } = useApp();

  const exportMd = () => downloadFile(`${slugify(report.title)}.md`, reportToMarkdown(report), "text/markdown");
  const exportJson = () => downloadFile(`${slugify(report.title)}.json`, JSON.stringify(report, null, 2), "application/json");
  const print = () => {
    if (!printReport(report)) toast("Pop-up blocked — allow pop-ups to print or save as PDF.", "error");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{report.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(report.createdAt)}</span>
            <Badge variant="secondary" className="capitalize">{report.depth}</Badge>
            <span>{report.sources.length} sources</span>
            {report.demo && <DemoBadge />}
          </div>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          {onSave && (
            <Button size="sm" onClick={onSave} disabled={saved}>
              <Save className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save report"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={exportMd}><FileText className="h-3.5 w-3.5" /> Markdown</Button>
          <Button size="sm" variant="outline" onClick={exportJson}><FileJson className="h-3.5 w-3.5" /> JSON</Button>
          <Button size="sm" variant="outline" onClick={print}><Printer className="h-3.5 w-3.5" /> PDF</Button>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
        <CardHeader className="pb-2"><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent><RichText text={report.summary} sources={report.sources} showCitations={settings.showCitations} /></CardContent>
      </Card>

      {report.keyFindings.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle>Key findings</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {report.keyFindings.map((f, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{i + 1}</span>
                  <span className="pt-0.5">{f}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {report.sections.map((s) => (
        <Card key={s.heading}>
          <CardHeader className="pb-2"><CardTitle>{s.heading}</CardTitle></CardHeader>
          <CardContent><RichText text={s.body} sources={report.sources} showCitations={settings.showCitations} /></CardContent>
        </Card>
      ))}

      {report.sources.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><Download className="h-4 w-4 text-primary" /> Sources</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.sources.map((s) => <SourceCard key={s.id} source={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
