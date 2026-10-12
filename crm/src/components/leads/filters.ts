import type { Lead } from "@/lib/types";
import type { Lookups } from "@/lib/store/hooks";
import { addDays, today } from "@/lib/utils";
import { groupOf } from "@/lib/store/selectors";

export interface LeadFilters {
  q: string;
  categoryId: string; // group or subcategory id
  city: string;
  stageId: string;
  priorityId: string;
  sourceId: string;
  follow: "" | "overdue" | "today" | "week" | "none";
}
export const emptyFilters: LeadFilters = { q: "", categoryId: "", city: "", stageId: "", priorityId: "", sourceId: "", follow: "" };

const digits = (s: string) => s.replace(/\D/g, "").replace(/^(00)?966/, "").replace(/^0/, "");

export function filterLeads(leads: Lead[], f: LeadFilters, lk: Lookups): Lead[] {
  const q = f.q.trim().toLowerCase();
  const qd = digits(q);
  const t = today();
  const wk = addDays(t, 7);
  return leads.filter((l) => {
    if (q) {
      const hit =
        l.companyName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.projectName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        (qd.length >= 3 && (digits(l.phone).includes(qd) || digits(l.whatsapp).includes(qd)));
      if (!hit) return false;
    }
    if (f.categoryId) {
      const hit = l.categoryIds.some((id) => id === f.categoryId || groupOf(lk.catById, id) === f.categoryId);
      if (!hit) return false;
    }
    if (f.city && l.city !== f.city) return false;
    if (f.stageId && l.stageId !== f.stageId) return false;
    if (f.priorityId && l.priorityId !== f.priorityId) return false;
    if (f.sourceId && l.sourceId !== f.sourceId) return false;
    if (f.follow) {
      const closed = ["won", "lost"].includes(lk.stageById.get(l.stageId)?.kind ?? "");
      const d = l.nextFollowUp;
      if (f.follow === "none") return !d && !closed;
      if (!d || closed) return false;
      if (f.follow === "overdue") return d < t;
      if (f.follow === "today") return d === t;
      if (f.follow === "week") return d >= t && d <= wk;
    }
    return true;
  });
}
