import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { ResearchReport, Settings } from "@/types";
import { cn, uid } from "@/lib/utils";

export const DEFAULT_SETTINGS: Settings = {
  displayName: "Explorer",
  language: "en",
  theme: "dark",
  units: "metric",

  location: {
    name: "Pune",
    country: "India",
    latitude: 18.5204,
    longitude: 73.8567
  },

  savedCities: [
    {
      name: "Delhi",
      country: "India",
      latitude: 28.6139,
      longitude: 77.2090
    },
    {
      name: "Bengaluru",
      country: "India",
      latitude: 12.9716,
      longitude: 77.5946
    },
    {
      name: "Bhubaneswar",
      country: "India",
      latitude: 20.2961,
      longitude: 85.8245
    },
    {
      name: "Bhopal",
      country: "India",
      latitude: 23.2599,
      longitude: 77.4126
    },
    {
      name: "Hyderabad",
      country: "India",
      latitude: 17.3850,
      longitude: 78.4867
    }
  ],
  // location: { name: "Pune", country: "India", latitude: 51.5072, longitude: -0.1276 },
  // savedCities: [
  //   { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.006 },
  //   { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  // ],
  researchDepth: "standard",
  maxSources: 6,
  includeNews: true,
  autoSaveReports: false,
  showCitations: true,
  webSearchDefault: true,
};

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

interface AppContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  reports: ResearchReport[];
  saveReport: (r: ResearchReport) => void;
  deleteReport: (id: string) => void;
  clearAllData: () => void;
  toast: (message: string, kind?: ToastKind) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [stored, setSettings] = useLocalStorage<Settings>("nexus.settings", DEFAULT_SETTINGS);
  const [reports, setReports] = useLocalStorage<ResearchReport[]>("nexus.reports", []);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Merge with defaults so newly-added settings keys never break older saved data.
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // Theme handling (dark / light / system).
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings({ ...settings, ...patch }),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
      reports,
      saveReport: (r) => setReports((prev) => [r, ...prev.filter((x) => x.id !== r.id)]),
      deleteReport: (id) => setReports((prev) => prev.filter((x) => x.id !== id)),
      clearAllData: () => {
        ["nexus.settings", "nexus.reports", "nexus.conversations", "nexus.sidebar"].forEach((k) => localStorage.removeItem(k));
        setSettings(DEFAULT_SETTINGS);
        setReports([]);
      },
      toast,
    }),
    [settings, reports, setSettings, setReports, toast],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? XCircle : Info;
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border bg-popover/95 p-3 text-sm shadow-xl backdrop-blur",
                t.kind === "error" && "border-destructive/40",
              )}
              role="status"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.kind === "success" && "text-emerald-400", t.kind === "error" && "text-destructive", t.kind === "info" && "text-blue-400")} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
