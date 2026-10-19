import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUp, BookmarkPlus, Check, Copy, Globe, History, Plus, RefreshCw, Sparkles, Square, Trash2, User } from "lucide-react";
import { DemoBadge } from "@/components/shared/common";
import { ParticleFieldBg } from "@/components/shared/ParticleFieldBg";
import { RichText } from "@/components/shared/RichText";
import { SourceCard } from "@/components/shared/SourceCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { hasBackend, isAbort, streamChat } from "@/lib/api";
import { SUGGESTED_PROMPTS } from "@/lib/demo";
import { cn, errorMessage, timeAgo, truncate, uid } from "@/lib/utils";
import type { ChatMessage, Conversation, ResearchReport } from "@/types";

export default function Chat() {
  const { settings, saveReport, reports, toast } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useLocalStorage<Conversation[]>("nexus.conversations", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(settings.webSearchDefault);
  const [streaming, setStreaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const handledPrompt = useRef(false);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const messages = active?.messages ?? [];

  const patchMessage = useCallback(
    (convId: string, msgId: string, fn: (m: ChatMessage) => ChatMessage) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) } : c)),
      );
    },
    [setConversations],
  );

  const run = useCallback(
    async (convId: string, history: ChatMessage[], assistantId: string) => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreaming(true);
      try {
        await streamChat(
          { messages: history.map((m) => ({ role: m.role, content: m.content })), webSearch, language: settings.language },
          (e) => {
            if (e.type === "token") patchMessage(convId, assistantId, (m) => ({ ...m, content: m.content + e.text }));
            else if (e.type === "sources") patchMessage(convId, assistantId, (m) => ({ ...m, sources: e.sources }));
            else if (e.type === "followups") patchMessage(convId, assistantId, (m) => ({ ...m, followUps: e.items }));
            else if (e.type === "error") patchMessage(convId, assistantId, (m) => ({ ...m, status: "error", error: e.message }));
            else if (e.type === "done") patchMessage(convId, assistantId, (m) => (m.status === "error" ? m : { ...m, status: "done" }));
          },
          ctrl.signal,
        );
      } catch (e) {
        if (isAbort(e)) patchMessage(convId, assistantId, (m) => ({ ...m, status: "done", followUps: undefined }));
        else patchMessage(convId, assistantId, (m) => ({ ...m, status: "error", error: errorMessage(e) }));
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [patchMessage, settings.language, webSearch],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;
      const now = new Date().toISOString();
      const userMsg: ChatMessage = { id: uid(), role: "user", content, status: "done", createdAt: now };
      const aiMsg: ChatMessage = { id: uid(), role: "assistant", content: "", status: "streaming", demo: !hasBackend, createdAt: now };

      let convId = activeId;
      const history = [...messages, userMsg];
      if (!convId) {
        convId = uid();
        const conv: Conversation = { id: convId, title: truncate(content, 52), messages: [userMsg, aiMsg], updatedAt: now };
        setConversations((prev) => [conv, ...prev].slice(0, 30));
        setActiveId(convId);
      } else {
        const id = convId;
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, messages: [...c.messages, userMsg, aiMsg], updatedAt: now } : c)));
      }
      setInput("");
      void run(convId, history, aiMsg.id);
    },
    [activeId, messages, run, setConversations, streaming],
  );

  const regenerate = () => {
    if (!active || streaming) return;
    const lastAi = [...active.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAi) return;
    const idx = active.messages.findIndex((m) => m.id === lastAi.id);
    const history = active.messages.slice(0, idx);
    const fresh: ChatMessage = { ...lastAi, id: uid(), content: "", sources: undefined, followUps: undefined, error: undefined, status: "streaming" };
    const convId = active.id;
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, messages: [...history, fresh] } : c)));
    void run(convId, history, fresh.id);
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    abortRef.current?.abort();
    setActiveId(null);
    setInput("");
    taRef.current?.focus();
  };

  // Prompt handed over from the dashboard / news cards.
  useEffect(() => {
    const prompt = (location.state as { prompt?: string } | null)?.prompt;
    if (prompt && !handledPrompt.current) {
      handledPrompt.current = true;
      navigate(location.pathname, { replace: true, state: null });
      send(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages, streaming]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const toReport = (m: ChatMessage, idx: number): ResearchReport => {
    const question = [...messages.slice(0, idx)].reverse().find((x) => x.role === "user")?.content ?? "Chat answer";
    return {
      id: `chat-${m.id}`,
      title: truncate(question, 80),
      query: question,
      summary: m.content,
      keyFindings: [],
      sections: [],
      sources: m.sources ?? [],
      depth: "quick",
      createdAt: new Date().toISOString(),
      demo: !!m.demo,
    };
  };

  const lastAiId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5 md:px-6">
        <Button variant="outline" size="sm" onClick={newChat}><Plus className="h-3.5 w-3.5" /> New chat</Button>
        <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}><History className="h-3.5 w-3.5" /> History</Button>
        <p className="ml-2 hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">{active?.title ?? "New conversation"}</p>
        {!hasBackend && <DemoBadge className="ml-auto" />}
      </div>

      {/* Messages */}
      <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <ParticleFieldBg />
        <div className="relative mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
          {messages.length === 0 && (
            <div className="animate-fade-up pt-6 text-center sm:pt-12">
              <div className="brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-indigo-500/30">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">What would you like to know?</h1>
              <p className="mt-2 text-muted-foreground">ANVEṢAṆAM AI searches the web, reads the sources and answers with citations.</p>
              <div className="mt-8 grid gap-2.5 text-left sm:grid-cols-2">
                {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                  <button key={p.title} onClick={() => send(p.prompt)} className="rounded-2xl border bg-card/60 p-3.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/40">
                    <span className="font-medium">{p.title}</span>
                    <span className="mt-1 line-clamp-2 block text-muted-foreground">{p.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, idx) => (
            <MessageRow
              key={m.id}
              message={m}
              isLast={m.id === lastAiId}
              streaming={streaming}
              showCitations={settings.showCitations}
              saved={reports.some((r) => r.id === `chat-${m.id}`)}
              onRegenerate={regenerate}
              onFollowUp={send}
              onSave={() => {
                saveReport(toReport(m, idx));
                toast("Saved to your reports", "success");
              }}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-background/60 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card/80 p-2 shadow-lg focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Ask anything…"
              aria-label="Message ANVEṢAṆAM AI"
              className="max-h-[180px] border-0 bg-transparent px-2 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <button
                type="button"
                onClick={() => setWebSearch((v) => !v)}
                aria-pressed={webSearch}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  webSearch ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Globe className="h-3.5 w-3.5" /> Web search {webSearch ? "on" : "off"}
              </button>
              {streaming ? (
                <Button size="icon" variant="secondary" className="h-9 w-9 rounded-xl" onClick={stop} aria-label="Stop generating">
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button size="icon" className="h-9 w-9 rounded-xl" onClick={() => send(input)} disabled={!input.trim()} aria-label="Send message">
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">ANVEṢAṆAM AI can make mistakes. Check the cited sources for anything important.</p>
        </div>
      </div>

      <HistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          abortRef.current?.abort();
          setActiveId(id);
          setHistoryOpen(false);
        }}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (id === activeId) setActiveId(null);
        }}
      />
    </div>
  );
}

function MessageRow({
  message: m,
  isLast,
  streaming,
  showCitations,
  saved,
  onRegenerate,
  onFollowUp,
  onSave,
}: {
  message: ChatMessage;
  isLast: boolean;
  streaming: boolean;
  showCitations: boolean;
  saved: boolean;
  onRegenerate: () => void;
  onFollowUp: (q: string) => void;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (m.role === "user") {
    return (
      <div className="flex animate-fade-up justify-end gap-3">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-2.5 text-sm text-white shadow-lg shadow-indigo-500/20">
          {m.content}
        </div>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary sm:flex"><User className="h-4 w-4" /></span>
      </div>
    );
  }

  const isStreaming = m.status === "streaming";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex animate-fade-up gap-3">
      <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-md">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      <div className="min-w-0 flex-1 space-y-4">
        {m.sources && m.sources.length > 0 && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Globe className="h-3.5 w-3.5" /> {m.sources.length} sources</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {m.sources.map((s) => <SourceCard key={s.id} source={s} />)}
            </div>
          </div>
        )}

        {isStreaming && !m.content && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />)}
            </span>
            Searching and thinking…
          </div>
        )}

        {m.content && <RichText text={m.content} sources={m.sources} showCitations={showCitations} streaming={isStreaming} />}

        {m.status === "error" && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Couldn't complete this answer</p>
            <p className="mt-0.5 text-muted-foreground">{m.error ?? "Unknown error."}</p>
            {isLast && <Button size="sm" variant="outline" className="mt-2" onClick={onRegenerate}><RefreshCw className="h-3.5 w-3.5" /> Retry</Button>}
          </div>
        )}

        {m.status === "done" && m.content && (
          <div className="flex flex-wrap items-center gap-1">
            <Button size="sm" variant="ghost" onClick={copy}>{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}</Button>
            <Button size="sm" variant="ghost" onClick={onSave} disabled={saved}><BookmarkPlus className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save as report"}</Button>
            {isLast && !streaming && <Button size="sm" variant="ghost" onClick={onRegenerate}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</Button>}
            {m.demo && <DemoBadge className="ml-1" />}
          </div>
        )}

        {isLast && m.status === "done" && m.followUps && m.followUps.length > 0 && !streaming && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Follow-up questions</p>
            <div className="flex flex-wrap gap-2">
              {m.followUps.map((q) => (
                <button key={q} onClick={() => onFollowUp(q)} className="rounded-full border bg-card/60 px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/10">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryDialog({
  open,
  onOpenChange,
  conversations,
  activeId,
  onSelect,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chat history</DialogTitle>
          <DialogDescription>Stored only in this browser.</DialogDescription>
        </DialogHeader>
        {conversations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <ul className="max-h-[50dvh] space-y-1.5 overflow-y-auto scrollbar-thin">
            {conversations.map((c) => (
              <li key={c.id} className={cn("flex items-center gap-2 rounded-xl border p-2", c.id === activeId && "border-primary/50 bg-primary/5")}>
                <button onClick={() => onSelect(c.id)} className="min-w-0 flex-1 px-1 text-left">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.messages.length} messages · {timeAgo(c.updatedAt)}</p>
                </button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(c.id)} aria-label={`Delete ${c.title}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
