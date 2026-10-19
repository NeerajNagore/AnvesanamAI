import { NavLink } from "react-router-dom";
import {
  BookMarked,
  CloudSun,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { hasBackend } from "@/lib/api";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavKey = "dashboard" | "chat" | "research" | "news" | "weather" | "reports" | "integrations" | "settings";

export const NAV_ITEMS: { to: string; key: NavKey; Icon: LucideIcon; end?: boolean }[] = [
  { to: "/", key: "dashboard", Icon: LayoutDashboard, end: true },
  { to: "/chat", key: "chat", Icon: MessageSquare },
  { to: "/research", key: "research", Icon: Search },
  { to: "/news", key: "news", Icon: Newspaper },
  { to: "/weather", key: "weather", Icon: CloudSun },
  { to: "/reports", key: "reports", Icon: BookMarked },
  { to: "/integrations", key: "integrations", Icon: Plug },
  { to: "/settings", key: "settings", Icon: SettingsIcon },
];

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function SidebarBody({ collapsed, onNavigate, onToggleCollapse, onClose }: { collapsed: boolean; onNavigate: () => void; onToggleCollapse?: () => void; onClose?: () => void }) {
  const { settings, reports } = useApp();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b px-4", collapsed ? "justify-center" : "justify-between")}>
        <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2.5" aria-label="ANVEṢAṆAM AI home">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          {!collapsed && <span className="text-lg font-bold tracking-tight">ANVEṢAṆAM <span className="gradient-text">AI</span></span>}
        </NavLink>
        {onClose && ( 
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin" aria-label="Main">
        {NAV_ITEMS.map(({ to, key, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? t(settings.language, key) : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{t(settings.language, key)}</span>}
            {!collapsed && key === "reports" && reports.length > 0 && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">{reports.length}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t p-3">
        {!collapsed ? (
          <div className="rounded-xl border bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <span className={cn("h-2 w-2 rounded-full", hasBackend ? "bg-emerald-400" : "bg-amber-400")} />
              {hasBackend ? "Backend connected" : "Demo mode"}
            </div>
            <p className="mt-1 text-muted-foreground">{hasBackend ? "Live search, news and AI." : "Showing labelled demo data. Weather is live."}</p>
          </div>
        ) : (
          <div className="flex justify-center py-1" title={hasBackend ? "Backend connected" : "Demo mode"}>
            <span className={cn("h-2.5 w-2.5 rounded-full", hasBackend ? "bg-emerald-400" : "bg-amber-400")} />
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" /> Collapse</>}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: Props) {
  return (
    <>
      {/* Desktop */}
      <aside className={cn("no-print hidden shrink-0 border-r bg-card/50 backdrop-blur-xl transition-[width] duration-300 lg:block", collapsed ? "w-[72px]" : "w-64")}>
        <SidebarBody collapsed={collapsed} onNavigate={() => undefined} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("no-print fixed inset-0 z-40 lg:hidden", !mobileOpen && "pointer-events-none")} aria-hidden={!mobileOpen}>
        <div className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", mobileOpen ? "opacity-100" : "opacity-0")} onClick={onCloseMobile} />
        <aside className={cn("absolute inset-y-0 left-0 w-72 max-w-[85%] border-r bg-card shadow-2xl transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <SidebarBody collapsed={false} onNavigate={onCloseMobile} onClose={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}
