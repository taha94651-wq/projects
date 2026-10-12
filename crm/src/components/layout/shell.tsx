"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  Columns3,
  Database,
  Languages,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Moon,
  Plus,
  Settings as SettingsIcon,
  Sun,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/card";
import { useUI } from "@/components/dialogs";
import { useAuth } from "./auth";
import { useConfirm } from "@/components/ui/confirm";
import { isOverdue } from "@/lib/store/selectors";
import { addDays, today as todayStr } from "@/lib/utils";

const NAV = [
  { href: "/", key: "navDashboard", icon: LayoutDashboard },
  { href: "/leads", key: "navLeads", icon: Users },
  { href: "/companies", key: "navCompanies", icon: Building2 },
  { href: "/pipeline", key: "navPipeline", icon: Columns3 },
  { href: "/sites", key: "navSites", icon: MapPin },
  { href: "/projects", key: "navProjects", icon: Briefcase },
  { href: "/followups", key: "navFollowUps", icon: CalendarCheck },
  { href: "/categories", key: "navCategories", icon: Layers },
  { href: "/sources", key: "navSources", icon: Megaphone },
  { href: "/reports", key: "navReports", icon: BarChart3 },
  { href: "/settings", key: "navSettings", icon: SettingsIcon },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { db, ready, loadError, mode, pending, reload, removeDemo, updateSettings, settings } = useStore();
  const { openLeadForm } = useUI();
  const { email, enabled, signOut } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const confirm = useConfirm();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    try {
      const d = localStorage.getItem("crm-theme") === "dark";
      setDark(d);
      document.documentElement.classList.toggle("dark", d);
    } catch {}
  }, []);
  const toggleDark = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
    try {
      localStorage.setItem("crm-theme", d ? "dark" : "light");
    } catch {}
  };

  const overdue = useMemo(() => (settings.reminders?.showOverdueBadge === false ? 0 : db.activities.filter((a) => isOverdue(a)).length), [db.activities, settings.reminders]);
  const dueSoon = useMemo(() => {
    const r = settings.reminders;
    if (!r?.enabled) return 0;
    const limit = addDays(todayStr(), r.daysBefore);
    const open = new Set(db.stages.filter((x) => x.kind === "open" || x.kind === "hold").map((x) => x.id));
    const leadIds = new Set<string>();
    for (const l of db.leads) if (l.nextFollowUp && l.nextFollowUp <= limit && open.has(l.stageId)) leadIds.add(l.id);
    for (const a of db.activities) if (!a.done && !a.system && a.dateTime.slice(0, 10) <= limit && a.leadId) leadIds.add(a.leadId);
    return leadIds.size;
  }, [db.leads, db.activities, db.stages, settings.reminders]);
  const hasDemo = db.leads.some((l) => l.isDemo) || db.companies.some((c) => c.isDemo);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {NAV.map(({ href, key, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-white",
              active && "bg-bronze/90 font-medium text-white hover:bg-bronze",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{t(key)}</span>
            {href === "/followups" && overdue > 0 && (
              <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">{overdue}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand />
        {nav}
        <StorageBadge mode={mode} />
      </aside>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground fade-in">
            <div className="flex items-center justify-between pe-3">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white/70">
                <X className="size-5" />
              </button>
            </div>
            {nav}
            <StorageBadge mode={mode} />
          </aside>
        </div>
      )}

      <div className="lg:ps-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu />
          </Button>
          <div className="flex-1" />
          {pending > 0 && <Spinner className="size-4" />}
          <Button variant="bronze" size="sm" onClick={() => openLeadForm()}>
            <Plus />
            <span className="hidden sm:inline">{t("newLead")}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { const l = lang === "en" ? "ar" : "en"; setLang(l); updateSettings({ language: l }); }} aria-label="Language">
            <Languages />
            {lang === "en" ? "العربية" : "EN"}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Theme">
            {dark ? <Sun /> : <Moon />}
          </Button>
          {enabled && (
            <Button variant="ghost" size="sm" onClick={signOut} title={email}>
              <LogOut className="rtl-flip" />
              <span className="hidden md:inline">{t("signOut")}</span>
            </Button>
          )}
        </header>

        {mode === "local" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs sm:px-5">
            <Database className="size-3.5 text-warning" />
            <span className="flex-1">{t("localModeBanner")}</span>
            <Link href="/settings#backup" className="font-medium text-bronze underline">
              {t("backupNow")}
            </Link>
          </div>
        )}
        {ready && dueSoon > 0 && settings.reminders?.enabled && (
          <Link href="/followups" className="flex items-center gap-2 border-b border-bronze/30 bg-bronze/10 px-4 py-2 text-xs sm:px-5">
            <AlertTriangle className="size-3.5 text-bronze" />
            <span className="flex-1 font-medium">{t("reminderBanner", { n: dueSoon })}</span>
            <span className="text-bronze underline">{t("viewAll")}</span>
          </Link>
        )}
        {hasDemo && ready && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-accent px-4 py-2 text-xs text-accent-foreground sm:px-5">
            <AlertTriangle className="size-3.5" />
            <span className="flex-1">{t("demoBanner")}</span>
            <button
              className="font-medium underline"
              onClick={async () => {
                if (await confirm({ title: t("removeDemo"), message: t("removeDemoConfirm"), confirmLabel: t("removeDemo") })) removeDemo();
              }}
            >
              {t("removeDemo")}
            </button>
          </div>
        )}

        <main className="p-3 sm:p-5">
          {loadError ? (
            <div className="mx-auto mt-10 max-w-lg rounded-lg border border-destructive/40 bg-card p-5 text-sm">
              <p className="mb-1 font-semibold text-destructive">{t("loadFailed")}</p>
              <p className="mb-3 break-words text-muted-foreground">{loadError}</p>
              {mode === "supabase" && <p className="mb-3">{t("loadFailedHint")}</p>}
              <Button onClick={reload}>{t("retry")}</Button>
            </div>
          ) : !ready ? (
            <div className="grid place-items-center py-24">
              <Spinner className="size-8" />
            </div>
          ) : (
            <div className="fade-in mx-auto max-w-[1600px]">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex h-14 items-center gap-2.5 px-4">
      <div className="grid size-8 place-items-center rounded-md bg-bronze text-sm font-bold text-white">FX</div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">{t("appName")}</div>
        <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">{t("appTagline")}</div>
      </div>
    </div>
  );
}

function StorageBadge({ mode }: { mode: "local" | "supabase" }) {
  const { t } = useI18n();
  return (
    <div className="m-3 rounded-md border border-white/10 p-2.5 text-[11px] leading-snug text-sidebar-foreground/70">
      <div className="mb-0.5 flex items-center gap-1.5 font-medium text-white">
        <span className={cn("size-2 rounded-full", mode === "supabase" ? "bg-green-400" : "bg-amber-400")} />
        {mode === "supabase" ? t("storageSupabase") : t("storageLocal")}
      </div>
      {mode === "supabase" ? t("storageSupabaseHint") : t("storageLocalHint")}
    </div>
  );
}
