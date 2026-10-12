"use client";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/card";
import type { Column } from "@/components/ui/data-table";
import type { Lead } from "@/lib/types";
import type { Lookups } from "@/lib/store/hooks";
import { formatDate, formatMoney, formatPhone, today, waLink } from "@/lib/utils";

export const ALL_LEAD_COLUMNS = [
  "code", "company", "contact", "jobTitle", "phone", "whatsapp", "email", "website", "city", "clientType", "categories", "project", "location",
  "value", "source", "priority", "stage", "lastContact", "nextFollowUp", "assignee", "created", "updated",
] as const;

export const COLUMN_LABEL_KEY: Record<string, string> = {
  code: "leadId", company: "company", contact: "contactPerson", jobTitle: "jobTitle", phone: "phone", whatsapp: "whatsapp", email: "email",
  website: "website", city: "city", clientType: "clientType", categories: "categories", project: "projectName", location: "projectLocation",
  value: "estimatedValue", source: "leadSource", priority: "priority", stage: "stage", lastContact: "lastContact", nextFollowUp: "nextFollowUp",
  assignee: "assignedTo", created: "dateCreated", updated: "lastUpdated",
};

export function PriorityBadge({ id, lk, name }: { id: string; lk: Lookups; name: (x: never) => string }) {
  const o = lk.optById.get(id);
  if (!o) return <span className="text-muted-foreground">—</span>;
  return <Badge color={o.color || "#64748b"}>{name(o as never)}</Badge>;
}

export function StageBadge({ lead, lk, name }: { lead: Lead; lk: Lookups; name: (x: never) => string }) {
  const s = lk.stageById.get(lead.stageId);
  if (!s) return <span className="text-muted-foreground">—</span>;
  return <Badge color={s.color}>{name(s as never)}</Badge>;
}

export function FollowUpText({ lead, lk, locale }: { lead: Lead; lk: Lookups; locale: string }) {
  if (!lead.nextFollowUp) return <span className="text-muted-foreground">—</span>;
  const closed = lk.stageById.get(lead.stageId)?.kind === "won" || lk.stageById.get(lead.stageId)?.kind === "lost";
  const t = today();
  const od = !closed && lead.nextFollowUp < t;
  const tod = !closed && lead.nextFollowUp === t;
  return <span className={od ? "font-medium text-destructive" : tod ? "font-medium text-warning" : ""}>{formatDate(lead.nextFollowUp, locale)}</span>;
}

export function leadColumns(ids: string[], lk: Lookups, ctx: { t: (k: string) => string; name: (x: never) => string; locale: string }): Column<Lead>[] {
  const { t, name, locale } = ctx;
  const defs: Record<string, Column<Lead>> = {
    code: { key: "code", header: t("leadId"), sort: (l) => l.code, cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.code}{l.isDemo && <Badge className="ms-1.5 bg-accent text-accent-foreground">{t("demo")}</Badge>}</span> },
    company: { key: "company", header: t("company"), sort: (l) => l.companyName.toLowerCase(), cell: (l) => <Link href={`/leads/view?id=${l.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:text-bronze hover:underline">{l.companyName}</Link> },
    contact: { key: "contact", header: t("contactPerson"), sort: (l) => l.contactName.toLowerCase(), cell: (l) => l.contactName || "—" },
    jobTitle: { key: "jobTitle", header: t("jobTitle"), sort: (l) => l.jobTitle, cell: (l) => l.jobTitle || "—" },
    phone: { key: "phone", header: t("phone"), sort: (l) => l.phone, cell: (l) => (l.phone ? <a href={`tel:${l.phone}`} onClick={(e) => e.stopPropagation()} className="ltr-num hover:underline">{formatPhone(l.phone)}</a> : "—") },
    whatsapp: { key: "whatsapp", header: t("whatsapp"), sort: (l) => l.whatsapp, cell: (l) => (l.whatsapp ? <a href={waLink(l.whatsapp)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-success hover:underline"><MessageCircle className="size-3.5" /><span className="ltr-num">{formatPhone(l.whatsapp)}</span></a> : "—") },
    email: { key: "email", header: t("email"), sort: (l) => l.email, cell: (l) => (l.email ? <a href={`mailto:${l.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline" dir="ltr">{l.email}</a> : "—") },
    website: { key: "website", header: t("website"), sort: (l) => l.website, cell: (l) => (l.website ? <a href={l.website} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline" dir="ltr">{l.website.replace(/^https?:\/\//, "")}</a> : "—") },
    city: { key: "city", header: t("city"), sort: (l) => l.city, cell: (l) => l.city || "—" },
    clientType: { key: "clientType", header: t("clientType"), sort: (l) => lk.optName(l.clientTypeId), cell: (l) => lk.optName(l.clientTypeId) || "—" },
    categories: {
      key: "categories", header: t("categories"), sort: (l) => lk.catName(l.categoryIds[0] ?? ""),
      cell: (l) => (
        <div className="flex max-w-[16rem] flex-wrap gap-1">
          {l.categoryIds.slice(0, 2).map((id) => <Badge key={id} className="bg-secondary">{lk.catName(id)}</Badge>)}
          {l.categoryIds.length > 2 && <Badge className="bg-secondary">+{l.categoryIds.length - 2}</Badge>}
          {!l.categoryIds.length && "—"}
        </div>
      ),
    },
    project: { key: "project", header: t("projectName"), sort: (l) => l.projectName.toLowerCase(), cell: (l) => <span className="block max-w-[14rem] truncate">{l.projectName || "—"}</span> },
    location: { key: "location", header: t("projectLocation"), sort: (l) => l.projectLocation, cell: (l) => l.projectLocation || "—" },
    value: { key: "value", header: t("estimatedValue"), sort: (l) => l.value ?? "", className: "text-end", cell: (l) => <span className="ltr-num tabular-nums">{l.value ? formatMoney(l.value, lk.currency) : "—"}</span> },
    source: { key: "source", header: t("leadSource"), sort: (l) => lk.optName(l.sourceId), cell: (l) => lk.optName(l.sourceId) || "—" },
    priority: { key: "priority", header: t("priority"), sort: (l) => lk.optById.get(l.priorityId)?.sort ?? "", cell: (l) => <PriorityBadge id={l.priorityId} lk={lk} name={name} /> },
    stage: { key: "stage", header: t("stage"), sort: (l) => lk.stageById.get(l.stageId)?.sort ?? "", cell: (l) => <StageBadge lead={l} lk={lk} name={name} /> },
    lastContact: { key: "lastContact", header: t("lastContact"), sort: (l) => l.lastContact, cell: (l) => formatDate(l.lastContact, locale) },
    nextFollowUp: { key: "nextFollowUp", header: t("nextFollowUp"), sort: (l) => l.nextFollowUp, cell: (l) => <FollowUpText lead={l} lk={lk} locale={locale} /> },
    assignee: { key: "assignee", header: t("assignedTo"), sort: (l) => lk.optName(l.assigneeId), cell: (l) => lk.optName(l.assigneeId) || "—" },
    created: { key: "created", header: t("dateCreated"), sort: (l) => l.createdAt, cell: (l) => formatDate(l.createdAt.slice(0, 10), locale) },
    updated: { key: "updated", header: t("lastUpdated"), sort: (l) => l.updatedAt, cell: (l) => formatDate(l.updatedAt.slice(0, 10), locale) },
  };
  const out: Column<Lead>[] = [];
  for (const id of ids) {
    if (defs[id]) out.push(defs[id]);
    else if (id.startsWith("cf:")) {
      const f = lk.customFields.find((x) => x.id === id.slice(3));
      if (f)
        out.push({
          key: id, header: lk.fieldLabel(f), sort: (l) => { const v = l.custom[f.id]; return Array.isArray(v) ? v.join(", ") : (v ?? ""); },
          cell: (l) => { const v = l.custom[f.id]; return Array.isArray(v) ? v.join(", ") || "—" : String(v ?? "") || "—"; },
        });
    }
  }
  return out;
}
