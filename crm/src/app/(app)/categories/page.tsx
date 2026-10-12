"use client";
import { useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryManager } from "@/components/settings/category-manager";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { leadsByGroup, revenueByService } from "@/lib/store/selectors";
import { formatMoney } from "@/lib/utils";
import { useLookups } from "@/lib/store/hooks";

export default function CategoriesPage() {
  const { t, name } = useI18n();
  const { db } = useStore();
  const lk = useLookups();
  const byGroup = useMemo(() => leadsByGroup(db), [db]);
  const rev = useMemo(() => revenueByService(db), [db]);
  const revByGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rev) { const g = r.cat.parentId || r.cat.id; m.set(g, (m.get(g) ?? 0) + r.value); }
    return m;
  }, [rev]);
  return (
    <div className="space-y-4">
      <PageHeader title={t("navCategories")} subtitle={t("categoriesSubtitle")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {byGroup.map((g) => (
          <Card key={g.id}><CardContent className="p-4">
            <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{name(g.cat)}</p>
            <p className="mt-1 text-xl font-semibold">{g.count} <span className="text-xs font-normal text-muted-foreground">{t("leads")}</span></p>
            <p className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: "start" }}>{formatMoney(revByGroup.get(g.id) ?? 0, lk.currency)}</p>
          </CardContent></Card>
        ))}
      </div>
      <CategoryManager />
    </div>
  );
}
