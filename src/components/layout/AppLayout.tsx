import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Moon, Sun } from "lucide-react";
import { Sidebar, NAV_ITEMS } from "./Sidebar";
import { DemoBadge } from "@/components/shared/common";
import { useApp } from "@/context/AppContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { hasBackend } from "@/lib/api";
import { t } from "@/lib/i18n";

export function AppLayout() {
  const { settings, updateSettings } = useApp();
  const [collapsed, setCollapsed] = useLocalStorage<boolean>("nexus.sidebar", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    document.getElementById("main")?.scrollTo({ top: 0 });
  }, [pathname]);

  const current = NAV_ITEMS.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  const isDark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {/* Ambient background */}
      <div className="no-print pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-purple-600/20 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-[110px]" />
      </div>

      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggleCollapse={() => setCollapsed((c) => !c)} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center gap-3 border-b bg-background/60 px-4 backdrop-blur-xl md:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 hover:bg-accent lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="truncate text-base font-semibold">{current ? t(settings.language, current.key) : "ANVEṢAṆAM AI"}</h2>
          <div className="ml-auto flex items-center gap-2">
            {!hasBackend && <DemoBadge className="hidden sm:inline-flex" label="Demo mode" />}
            <button
              onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
              className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-md"
              aria-label="Open settings"
              title={settings.displayName}
            >
              {settings.displayName.trim().charAt(0).toUpperCase() || "N"}
            </button>
          </div>
        </header>

        <main id="main" className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl animate-fade-up space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>;
}
