"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Copy, ExternalLink, Mail, MessageCircle, Pencil, Phone, Plus, Send, Trash2 } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { ContactsPanel } from "@/components/contacts-panel";
import { Timeline } from "@/components/timeline";
import { PriorityBadge, StageBadge } from "@/components/leads/columns";
import { useUI } from "@/components/dialogs";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { planDeleteLeads, planDuplicateLead, planSaveActivity } from "@/lib/store/logic";
import { weightedValue } from "@/lib/store/selectors";
import { formatDate, formatMoney, formatPhone, nowIso, uid, waLink } from "@/lib/utils";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  if (children === "" || children === null || children === undefined) return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, name, label, locale } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const confirm = useConfirm();
  const { openLeadForm, openActivity, moveLead } = useUI();
  const [tab, setTab] = useState<"timeline" | "contacts" | "projects">("timeline");
  const [note, setNote] = useState("");

  const lead = db.leads.find((l) => l.id === id);
  const acts = useMemo(() => db.activities.filter((a) => a.leadId === id), [db.activities, id]);
  const projects = useMemo(() => db.projects.filter((p) => p.leadId === id), [db.projects, id]);

  if (!lead)
    return (
      <Card>
        <EmptyState title={t("leadNotFound")} action={<Button onClick={() => router.push("/leads")}>{t("backToLeads")}</Button>} />
      </Card>
    );

  const company = lk.companyById.get(lead.companyId);
  const stage = lk.stageById.get(lead.stageId);

  const addNote = async () => {
    if (!note.trim()) return;
    const noteType = lk.opts("activityType").find((o) => o.key === "note");
    const d = new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const ch = planSaveActivity(db, {
      id: uid(), leadId: lead.id, companyId: lead.companyId, projectId: "", typeId: noteType?.id ?? "", dateTime: local,
      description: note.trim(), outcome: "", nextAction: "", nextFollowUp: "", done: true, completedAt: nowIso(), system: false, isDemo: lead.isDemo,
    });
    if (await commit(ch)) setNote("");
  };

  const del = async () => {
    if (!(await confirm({ title: t("deleteLeads", { n: 1 }), message: t("deleteLeadsConfirm", { n: 1 }) }))) return;
    if (await commit(planDeleteLeads(db, [lead.id]))) {
      notify(t("deleted"));
      router.push("/leads");
    }
  };
  const dup = async () => {
    const r = planDuplicateLead(db, lead.id);
    if (r && (await commit(r.changes))) {
      notify(t("leadDuplicated", { code: r.lead.code }));
      router.push(`/leads/${r.lead.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 rtl-flip" /> {t("navLeads")}
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{lead.code}</span>
              {lead.isDemo && <Badge className="bg-accent text-accent-foreground">{t("demo")}</Badge>}
              <StageBadge lead={lead} lk={lk} name={name as never} />
              <PriorityBadge id={lead.priorityId} lk={lk} name={name as never} />
            </div>
            <h1 className="mt-1 text-xl font-semibold">{lead.companyName}</h1>
            <p className="text-sm text-muted-foreground">{lead.projectName}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight" dir="ltr" style={{ textAlign: "start" }}>
              {lead.value ? formatMoney(lead.value, lk.currency) : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select className="w-auto min-w-[12rem]" value={lead.stageId} onChange={(e) => moveLead(lead.id, e.target.value)} aria-label={t("stage")}>
              {lk.stages.map((s) => <option key={s.id} value={s.id}>{name(s)}</option>)}
            </Select>
            {lead.phone && <a href={`tel:${lead.phone}`}><Button variant="outline" size="icon" aria-label={t("call")}><Phone /></Button></a>}
            {lead.whatsapp && <a href={waLink(lead.whatsapp)} target="_blank" rel="noreferrer"><Button variant="outline" size="icon" aria-label="WhatsApp" className="text-success"><MessageCircle /></Button></a>}
            {lead.email && <a href={`mailto:${lead.email}`}><Button variant="outline" size="icon" aria-label={t("email")}><Mail /></Button></a>}
            <Button variant="outline" onClick={() => openLeadForm({ leadId: lead.id })}><Pencil /> {t("edit")}</Button>
            <Button variant="outline" size="icon" aria-label={t("duplicate")} onClick={dup}><Copy /></Button>
            <Button variant="outline" size="icon" aria-label={t("delete")} className="text-destructive" onClick={del}><Trash2 /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>{t("details")}</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y">
                <Row k={t("contactPerson")}>{lead.contactName}{lead.jobTitle && <span className="text-muted-foreground"> · {lead.jobTitle}</span>}</Row>
                <Row k={t("phone")}>{lead.phone && <span className="ltr-num">{formatPhone(lead.phone)}</span>}</Row>
                <Row k={t("whatsapp")}>{lead.whatsapp && <span className="ltr-num">{formatPhone(lead.whatsapp)}</span>}</Row>
                <Row k={t("email")}>{lead.email && <a className="hover:underline" dir="ltr" href={`mailto:${lead.email}`}>{lead.email}</a>}</Row>
                <Row k={t("website")}>{lead.website && <a className="inline-flex items-center gap-1 hover:underline" dir="ltr" href={lead.website} target="_blank" rel="noreferrer">{lead.website.replace(/^https?:\/\//, "")}<ExternalLink className="size-3" /></a>}</Row>
                <Row k={t("linkedin")}>{lead.linkedin && <a className="hover:underline" dir="ltr" href={lead.linkedin} target="_blank" rel="noreferrer">{lead.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</a>}</Row>
                <Row k={t("instagram")}>{lead.instagram && <span dir="ltr">{lead.instagram}</span>}</Row>
                <Row k={t("city")}>{lead.city}</Row>
                <Row k={t("company")}>{company && <Link className="text-bronze hover:underline" href={`/companies/${company.id}`}>{company.name}</Link>}</Row>
                <Row k={t("clientType")}>{lk.optName(lead.clientTypeId)}</Row>
                <Row k={t("categories")}>
                  {lead.categoryIds.length > 0 && <div className="flex flex-wrap gap-1">{lead.categoryIds.map((c) => <Badge key={c} className="bg-secondary">{lk.catName(c)}</Badge>)}</div>}
                </Row>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("projectAndPipeline")}</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y">
                <Row k={t("projectLocation")}>{lead.projectLocation}</Row>
                <Row k={t("description")}><span className="whitespace-pre-wrap">{lead.description}</span></Row>
                <Row k={t("expectedStart")}>{lead.expectedStart && formatDate(lead.expectedStart, locale)}</Row>
                <Row k={t("leadSource")}>{lk.optName(lead.sourceId)}</Row>
                <Row k={t("assignedTo")}>{lk.optName(lead.assigneeId)}</Row>
                <Row k={t("lastContact")}>{lead.lastContact && formatDate(lead.lastContact, locale)}</Row>
                <Row k={t("nextFollowUp")}>{lead.nextFollowUp && formatDate(lead.nextFollowUp, locale)}</Row>
                <Row k={t("dateCreated")}>{formatDate(lead.createdAt.slice(0, 10), locale)}</Row>
                <Row k={t("lastUpdated")}>{formatDate(lead.updatedAt.slice(0, 10), locale)}</Row>
                {lk.customFields.map((f) => {
                  const v = lead.custom[f.id];
                  const s = Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v);
                  return <Row key={f.id} k={label(f)}>{s}</Row>;
                })}
                <Row k={t("notes")}><span className="whitespace-pre-wrap">{lead.notes}</span></Row>
              </dl>
            </CardContent>
          </Card>
          {lead.outcome && (
            <Card className={lead.outcome.result === "won" ? "border-success/50" : "border-destructive/40"}>
              <CardHeader><CardTitle>{lead.outcome.result === "won" ? t("outcomeWon") : t("outcomeLost")}</CardTitle></CardHeader>
              <CardContent className="pt-2">
                <dl className="divide-y">
                  <Row k={t("outcomeDate")}>{formatDate(lead.outcome.date, locale)}</Row>
                  {lead.outcome.result === "won" && <Row k={t("finalContractValue")}><span dir="ltr">{formatMoney(lead.outcome.finalValue ?? lead.value, lk.currency)}</span></Row>}
                  <Row k={t("lossReason")}>{lk.optName(lead.outcome.reasonId)}</Row>
                  <Row k={t("reason")}>{lead.outcome.reason}</Row>
                  <Row k={t("outcomeNotes")}>{lead.outcome.notes}</Row>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="self-start">
          <div className="flex gap-1 border-b px-3 pt-2" role="tablist">
            {(["timeline", "contacts", "projects"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`border-b-2 px-3 py-2 text-sm ${tab === k ? "border-bronze font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t(k === "timeline" ? "timeline" : k === "contacts" ? "contacts" : "navProjects")}
                {k === "projects" && projects.length > 0 && ` (${projects.length})`}
              </button>
            ))}
          </div>
          <CardContent>
            {tab === "timeline" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea rows={2} placeholder={t("addNotePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="bronze" onClick={addNote} disabled={!note.trim()}><Send /> {t("addNote")}</Button>
                    <Button size="sm" variant="outline" onClick={() => openActivity({ leadId: lead.id, done: true })}><Plus /> {t("logActivity")}</Button>
                    <Button size="sm" variant="outline" onClick={() => openActivity({ leadId: lead.id })}><CalendarPlus /> {t("scheduleActivity")}</Button>
                  </div>
                </div>
                <Timeline activities={acts} />
              </div>
            )}
            {tab === "contacts" && (company ? <ContactsPanel companyId={company.id} /> : <p className="py-6 text-center text-sm text-muted-foreground">{t("noCompanyLinked")}</p>)}
            {tab === "projects" && (
              <div className="space-y-2">
                {projects.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("noProjects")}</p>}
                {projects.map((p) => (
                  <Link key={p.id} href="/projects" className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent/50">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">{formatMoney(weightedValue(p), lk.currency)} · {p.probability}%</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {stage && <span className="sr-only">{name(stage)}</span>}
    </div>
  );
}
