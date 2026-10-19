import { useState, type ReactNode } from "react";
import { Download, Monitor, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, Segmented, Select } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";
import { downloadFile } from "@/lib/export";
import { LANGUAGES } from "@/lib/i18n";
import type { Lang, ResearchDepth } from "@/types";

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="sm:w-64 sm:shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = `sw-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-6 py-3">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, resetSettings, clearAllData, reports, toast } = useApp();
  const [confirm, setConfirm] = useState<"reset" | "clear" | null>(null);

  const exportData = () => {
    const conversations = (() => {
      try {
        return JSON.parse(localStorage.getItem("nexus.conversations") ?? "[]");
      } catch {
        return [];
      }
    })();
    downloadFile("nexus-data.json", JSON.stringify({ settings, reports, conversations }, null, 2), "application/json");
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Preferences are saved automatically in this browser." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile & language</CardTitle><CardDescription>How ANVE\u1e62A\u1e46AM AI greets you and the language it responds in.</CardDescription></CardHeader>
          <CardContent className="divide-y">
            <Row label="Display name" htmlFor="name">
              <Input id="name" value={settings.displayName} maxLength={40} onChange={(e) => updateSettings({ displayName: e.target.value })} placeholder="Your name" />
            </Row>
            <Row label="Language" hint="Interface labels and AI response language." htmlFor="lang">
              <Select id="lang" value={settings.language} onChange={(e) => updateSettings({ language: e.target.value as Lang })}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.native} ({l.label})</option>)}
              </Select>
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Appearance & units</CardTitle><CardDescription>Theme and measurement preferences.</CardDescription></CardHeader>
          <CardContent className="divide-y">
            <Row label="Theme">
              <Segmented
                ariaLabel="Theme"
                className="w-full"
                value={settings.theme}
                onChange={(theme) => updateSettings({ theme })}
                options={[
                  { value: "dark", label: <><Moon className="h-3.5 w-3.5" /> Dark</> },
                  { value: "light", label: <><Sun className="h-3.5 w-3.5" /> Light</> },
                  { value: "system", label: <><Monitor className="h-3.5 w-3.5" /> Auto</> },
                ]}
              />
            </Row>
            <Row label="Units" hint="Used on the weather pages.">
              <Segmented ariaLabel="Units" className="w-full" value={settings.units} onChange={(units) => updateSettings({ units })} options={[{ value: "metric", label: "Metric (°C)" }, { value: "imperial", label: "Imperial (°F)" }]} />
            </Row>
            <Row label="Default city" hint="Change it from the Weather page.">
              <p className="text-sm font-medium">{settings.location.name}{settings.location.country ? `, ${settings.location.country}` : ""}</p>
            </Row>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Research preferences</CardTitle><CardDescription>Defaults for chat and the Web Research page.</CardDescription></CardHeader>
          <CardContent className="grid gap-x-10 lg:grid-cols-2">
            <div className="divide-y">
              <Row label="Default depth" htmlFor="depth" hint="Deeper runs read more sources.">
                <Select id="depth" value={settings.researchDepth} onChange={(e) => updateSettings({ researchDepth: e.target.value as ResearchDepth })}>
                  <option value="quick">Quick</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </Select>
              </Row>
              <Row label="Maximum sources" htmlFor="max">
                <Select id="max" value={String(settings.maxSources)} onChange={(e) => updateSettings({ maxSources: Number(e.target.value) })}>
                  {[3, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} sources</option>)}
                </Select>
              </Row>
            </div>
            <div className="divide-y">
              <ToggleRow label="Web search on by default" hint="New chats start with web search enabled." checked={settings.webSearchDefault} onChange={(webSearchDefault) => updateSettings({ webSearchDefault })} />
              <ToggleRow label="Show inline citations" hint="Display numbered [1] markers in answers." checked={settings.showCitations} onChange={(showCitations) => updateSettings({ showCitations })} />
              <ToggleRow label="Include recent news" hint="Add current headlines to research reports." checked={settings.includeNews} onChange={(includeNews) => updateSettings({ includeNews })} />
              <ToggleRow label="Auto-save reports" hint="Save every finished research report." checked={settings.autoSaveReports} onChange={(autoSaveReports) => updateSettings({ autoSaveReports })} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Your data</CardTitle><CardDescription>Everything is stored locally in this browser. API keys are never stored here.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}><Download className="h-4 w-4" /> Export data</Button>
            <Button variant="outline" onClick={() => setConfirm("reset")}><RotateCcw className="h-4 w-4" /> Reset settings</Button>
            <Button variant="destructive" onClick={() => setConfirm("clear")}><Trash2 className="h-4 w-4" /> Clear all data</Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "clear" ? "Clear all local data?" : "Reset settings?"}</DialogTitle>
            <DialogDescription>
              {confirm === "clear" ? "This removes settings, chat history and all saved reports from this browser. It can't be undone." : "Your preferences return to their defaults. Reports and chats are kept."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              variant={confirm === "clear" ? "destructive" : "default"}
              onClick={() => {
                if (confirm === "clear") clearAllData();
                else resetSettings();
                setConfirm(null);
                toast(confirm === "clear" ? "All local data cleared" : "Settings reset", "success");
              }}
            >
              {confirm === "clear" ? "Clear everything" : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
