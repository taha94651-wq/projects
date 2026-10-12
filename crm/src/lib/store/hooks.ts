"use client";
import { useMemo } from "react";
import { useStore } from "./store";
import { useI18n } from "../i18n";
import { indexById, optionsOf, sorted } from "./selectors";
import type { Option, OptionList } from "../types";

/** Lookup maps and localized name helpers shared by every page. */
export function useLookups() {
  const { db, settings } = useStore();
  const { name, label } = useI18n();
  return useMemo(() => {
    const stageById = indexById(db.stages);
    const optById = indexById(db.options);
    const catById = indexById(db.categories);
    const companyById = indexById(db.companies);
    const leadById = indexById(db.leads);
    const stages = sorted(db.stages);
    return {
      stages,
      stageById,
      optById,
      catById,
      companyById,
      leadById,
      groups: sorted(db.categories.filter((c) => !c.parentId)),
      customFields: sorted(db.customFields),
      opts: (l: OptionList): Option[] => optionsOf(db, l),
      optName: (id: string) => name(optById.get(id)),
      stageName: (id: string) => name(stageById.get(id)),
      catName: (id: string) => name(catById.get(id)),
      currency: settings.currency || "SAR",
      fieldLabel: label,
    };
  }, [db, settings.currency, name, label]);
}
export type Lookups = ReturnType<typeof useLookups>;
