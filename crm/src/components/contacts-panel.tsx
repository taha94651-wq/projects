"use client";
import { useEffect, useState } from "react";
import { MessageCircle, Mail, Pencil, Phone, Plus, Star, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { Badge } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import type { Contact } from "@/lib/types";
import { canonPhone, formatPhone, isEmail, isValidPhone, nowIso, uid, waLink } from "@/lib/utils";

export function ContactsPanel({ companyId }: { companyId: string }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const confirm = useConfirm();
  const [edit, setEdit] = useState<Contact | "new" | null>(null);
  const list = db.contacts.filter((c) => c.companyId === companyId).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));

  const remove = async (c: Contact) => {
    if (!(await confirm({ title: t("deleteContact"), message: t("deleteContactConfirm", { name: c.name }) }))) return;
    const changes: Parameters<typeof commit>[0] = { remove: { contacts: [c.id] } };
    if (c.isPrimary) {
      const next = list.find((x) => x.id !== c.id);
      if (next) changes.upsert = { contacts: [{ ...next, isPrimary: true, updatedAt: nowIso() }] };
    }
    if (await commit(changes)) notify(t("deleted"));
  };
  const makePrimary = async (c: Contact) => {
    await commit({ upsert: { contacts: list.map((x) => ({ ...x, isPrimary: x.id === c.id, updatedAt: nowIso() })) } });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("contacts")} ({list.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setEdit("new")} disabled={!companyId}>
          <Plus /> {t("addContact")}
        </Button>
      </div>
      {list.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("noContacts")}</p>}
      {list.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              {c.name}
              {c.isPrimary && <Badge className="bg-accent text-accent-foreground">{t("primary")}</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">{c.jobTitle}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="size-3" /><span className="ltr-num">{formatPhone(c.phone)}</span></a>}
              {c.whatsapp && <a href={waLink(c.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-success hover:underline"><MessageCircle className="size-3" /><span className="ltr-num">{formatPhone(c.whatsapp)}</span></a>}
              {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="size-3" />{c.email}</a>}
            </div>
          </div>
          {!c.isPrimary && <Button size="iconSm" variant="ghost" title={t("makePrimary")} aria-label={t("makePrimary")} onClick={() => makePrimary(c)}><Star /></Button>}
          <Button size="iconSm" variant="ghost" aria-label={t("edit")} onClick={() => setEdit(c)}><Pencil /></Button>
          <Button size="iconSm" variant="ghost" aria-label={t("delete")} className="text-destructive" onClick={() => remove(c)}><Trash2 /></Button>
        </div>
      ))}
      <ContactDialog companyId={companyId} contact={edit} onClose={() => setEdit(null)} />
    </div>
  );
}

function ContactDialog({ companyId, contact, onClose }: { companyId: string; contact: Contact | "new" | null; onClose: () => void }) {
  const { t } = useI18n();
  const { db, commit, notify } = useStore();
  const [f, setF] = useState({ name: "", jobTitle: "", phone: "", whatsapp: "", email: "", notes: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!contact) return;
    setErr({});
    setF(contact === "new" ? { name: "", jobTitle: "", phone: "", whatsapp: "", email: "", notes: "" } : { name: contact.name, jobTitle: contact.jobTitle, phone: contact.phone, whatsapp: contact.whatsapp, email: contact.email, notes: contact.notes });
  }, [contact]);

  const schema = z.object({
    name: z.string().trim().min(1, t("errRequired")).max(120),
    phone: z.string().refine(isValidPhone, t("errPhone")),
    whatsapp: z.string().refine(isValidPhone, t("errPhone")),
    email: z.string().refine(isEmail, t("errEmail")),
  });

  const save = async () => {
    const r = schema.safeParse(f);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
      return setErr(e);
    }
    const n = nowIso();
    const isNew = contact === "new";
    const hasPrimary = db.contacts.some((c) => c.companyId === companyId && c.isPrimary);
    const row: Contact = {
      ...(isNew ? { id: uid(), companyId, isPrimary: !hasPrimary, isDemo: false, createdAt: n } : (contact as Contact)),
      name: f.name.trim(),
      jobTitle: f.jobTitle.trim(),
      phone: canonPhone(f.phone),
      whatsapp: canonPhone(f.whatsapp),
      email: f.email.trim(),
      notes: f.notes,
      updatedAt: n,
    } as Contact;
    if (await commit({ upsert: { contacts: [row] } })) {
      notify(t("saved"));
      onClose();
    }
  };

  return (
    <Modal open={!!contact} onOpenChange={(o) => !o && onClose()} title={contact === "new" ? t("addContact") : t("editContact")} size="md"
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("name")} required error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t("jobTitle")}><Input value={f.jobTitle} onChange={(e) => setF({ ...f, jobTitle: e.target.value })} /></Field>
        <Field label={t("phone")} error={err.phone}><Input dir="ltr" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label={t("whatsapp")} error={err.whatsapp}><Input dir="ltr" type="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
        <Field label={t("email")} error={err.email} className="sm:col-span-2"><Input dir="ltr" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t("notes")} className="sm:col-span-2"><Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
