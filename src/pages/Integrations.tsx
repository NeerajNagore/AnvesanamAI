import { useState } from "react";
import { CheckCircle2, CloudSun, ExternalLink, KeyRound, Newspaper, Search, ShieldCheck, Sparkles, Trash2, Zap, type LucideIcon } from "lucide-react";
import { PageContainer } from "@/components/layout/AppLayout";
import { ErrorState, PageHeader, Spinner } from "@/components/shared/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Skeleton } from "@/components/ui/misc";
import { useApp } from "@/context/AppContext";
import { useAsync } from "@/hooks/useAsync";
import { API_BASE, getIntegrations, hasBackend, removeIntegrationKey, saveIntegrationKey, testIntegration } from "@/lib/api";
import { errorMessage } from "@/lib/utils";
import type { IntegrationId, IntegrationStatus } from "@/types";

interface Provider {
  id: IntegrationId;
  name: string;
  description: string;
  Icon: LucideIcon;
  env: string;
  docs: string;
  optional?: boolean;
}

const PROVIDERS: Provider[] = [
  { id: "grok", name: "Groq", description: "Fast language model (Llama 3) that writes answers, summaries and research reports.", Icon: Sparkles, env: "GROQ_API_KEY", docs: "https://console.groq.com/keys" },
  { id: "tavily", name: "Tavily", description: "Web search API that retrieves sources for chat and research.", Icon: Search, env: "TAVILY_API_KEY", docs: "https://app.tavily.com" },
  { id: "newsapi", name: "GNews / NewsAPI", description: "Live headlines by category for the News page and dashboard. GNews free tier is used when no key is set.", Icon: Newspaper, env: "NEWSAPI_KEY", docs: "https://gnews.io" },
  { id: "weather", name: "Weather", description: "Uses Open-Meteo by default — free and keyless. No additional key is required.", Icon: CloudSun, env: "", docs: "https://open-meteo.com", optional: true },
];

const ENDPOINTS: [string, string, string][] = [
  ["POST", "/chat/stream", "Server-Sent Events: token, sources, followups, error, done"],
  ["POST", "/research", "Returns a ResearchReport JSON object"],
  ["GET", "/news?category=&q=", "Returns { articles: NewsArticle[] }"],
  ["GET", "/weather?lat=&lon=&units=", "Optional — falls back to Open-Meteo"],
  ["GET", "/integrations", "Returns { integrations: [{ id, configured }] } — never key values"],
  ["PUT", "/integrations/{id}", "Body { apiKey } — stored server-side only"],
  ["DELETE", "/integrations/{id}", "Removes the stored key"],
  ["POST", "/integrations/{id}/test", "Returns { ok, message }"],
];

export default function Integrations() {
  const { data, loading, error, reload } = useAsync((s) => getIntegrations(s), []);

  return (
    <PageContainer>
      <PageHeader title="API Integrations" description="Connect the services that power live search, news and AI answers." />

      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium">Your keys never live in the browser</p>
            <p className="mt-1 text-muted-foreground">
              Keys you enter here are sent once to your backend over HTTPS and stored there. The page clears the field immediately and never saves it to local storage, cookies or the app bundle.
            </p>
          </div>
        </CardContent>
      </Card>

      {!hasBackend && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium">No backend connected — running in demo mode</p>
            <p className="text-muted-foreground">Key entry is disabled until the FastAPI backend is reachable. Point the frontend at it, then restart the dev server:</p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs scrollbar-thin">{"# .env.local\nVITE_API_BASE_URL=/api   # proxied to http://localhost:8000"}</pre>
          </CardContent>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {PROVIDERS.map((p) =>
            loading ? <Skeleton key={p.id} className="h-64" /> : <ProviderCard key={p.id} provider={p} status={data?.find((s) => s.id === p.id)} onChanged={reload} />,
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>FastAPI backend contract</CardTitle>
          <CardDescription>The frontend calls these endpoints under <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{API_BASE || "VITE_API_BASE_URL"}</code>.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <tbody className="divide-y">
              {ENDPOINTS.map(([method, path, note]) => (
                <tr key={method + path}>
                  <td className="py-2 pr-3"><Badge variant={method === "GET" ? "success" : method === "DELETE" ? "destructive" : "default"}>{method}</Badge></td>
                  <td className="py-2 pr-3 font-mono text-xs">{path}</td>
                  <td className="py-2 text-muted-foreground">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function ProviderCard({ provider: p, status, onChanged }: { provider: Provider; status?: IntegrationStatus; onChanged: () => void }) {
  const { toast } = useApp();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const configured = !!status?.configured;
  const keyless = p.id === "weather";

  const save = async () => {
    const value = key.trim();
    if (!value) return;
    setBusy("save");
    try {
      await saveIntegrationKey(p.id, value);
      toast(`${p.name} key saved on the server`, "success");
      onChanged();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setKey(""); // never keep the secret in component state
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const r = await testIntegration(p.id);
      toast(r.message, r.ok ? "success" : "error");
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("remove");
    try {
      await removeIntegrationKey(p.id);
      toast(`${p.name} key removed`, "success");
      onChanged();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md"><p.Icon className="h-5 w-5 text-white" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{p.name}</CardTitle>
            {configured ? <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> {keyless && !hasBackend ? "Active (no key)" : "Connected"}</Badge> : <Badge variant="outline">Not connected</Badge>}
            {p.optional && <Badge variant="secondary">Optional</Badge>}
          </div>
          <CardDescription className="mt-1.5">{status?.message ?? p.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={`key-${p.id}`}>API key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id={`key-${p.id}`}
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={!hasBackend || busy !== null}
                placeholder={configured ? "•••••••• stored on server" : hasBackend ? "Paste your key" : "Backend required"}
                className="pl-9"
              />
            </div>
            <Button onClick={save} disabled={!hasBackend || !key.trim() || busy !== null}>{busy === "save" ? <Spinner /> : "Save"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">Or set <code className="rounded bg-muted px-1 py-0.5">{p.env}</code> in the backend's environment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={test} disabled={!hasBackend || !configured || busy !== null}>{busy === "test" ? <Spinner /> : <Zap className="h-3.5 w-3.5" />} Test connection</Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={!hasBackend || !configured || keyless || busy !== null}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
          <Button asChild size="sm" variant="ghost" className="ml-auto"><a href={p.docs} target="_blank" rel="noopener noreferrer">Get a key <ExternalLink className="h-3.5 w-3.5" /></a></Button>
        </div>
      </CardContent>
    </Card>
  );
}
