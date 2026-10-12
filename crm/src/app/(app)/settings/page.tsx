"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CategoryManager } from "@/components/settings/category-manager";
import { StageManager } from "@/components/settings/stage-manager";
import { AllOptionLists } from "@/components/settings/option-manager";
import { FieldManager } from "@/components/settings/field-manager";
import { ColumnsPanel, DataPanel, GeneralPanel, RemindersPanel } from "@/components/settings/panels";

const TABS = ["general", "categories", "pipeline", "lists", "fields", "columns", "reminders", "data"] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { general: "tabGeneral", categories: "navCategories", pipeline: "tabPipeline", lists: "tabLists", fields: "tabFields", columns: "tabColumns", reminders: "reminders", data: "tabData" };

export default function SettingsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("general");
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h === "backup") setTab("data");
  }, []);
  return (
    <div className="space-y-4">
      <PageHeader title={t("navSettings")} subtitle={t("settingsSubtitle")} />
      <div className="scroll-thin flex gap-1 overflow-x-auto border-b" role="tablist">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("shrink-0 border-b-2 px-3 py-2 text-sm", tab === k ? "border-bronze font-medium" : "border-transparent text-muted-foreground hover:text-foreground")}>{t(LABEL[k])}</button>
        ))}
      </div>
      {tab === "general" && <GeneralPanel />}
      {tab === "categories" && <CategoryManager />}
      {tab === "pipeline" && <StageManager />}
      {tab === "lists" && <AllOptionLists />}
      {tab === "fields" && <FieldManager />}
      {tab === "columns" && <ColumnsPanel />}
      {tab === "reminders" && <RemindersPanel />}
      {tab === "data" && <DataPanel />}
    </div>
  );
}
