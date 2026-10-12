"use client";
import { useMemo, useState } from "react";
import { Building, Crosshair, ExternalLink, FilePlus2, MapPin, MessageCircle, Pencil, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, CardContent, EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm";
import { useUI } from "@/components/dialogs";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store/store";
import { useLookups } from "@/lib/store/hooks";
import { exportTableCSV } from "@/lib/io";
import type { Site, SiteContact } from "@/lib/types";
import { canonPhone, canonUrl, formatDate, formatPhone, isUrl, isValidPhone, nowIso, today, uid, waLink } from "@/lib/utils";

const mapsLink = (s: Site) => s.mapsUrl || (s.lat !== null && s.lng !== null ? `https://www.google.com/maps?q=${s.lat},${s.lng}` : "");

export default function SitesPage() {
  const { t, name, locale } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const confirm = useConfirm();
  const { openLeadForm } = useUI();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState<{ open: boolean; id?: string }>({ open: false });

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const qd = ql.replace(/\D/g, "").replace(/^(00)?966/, "").replace(/^0/, "");
    return db.sites
      .filter((s) => {
        if (city && s.city !== city) return false;
        if (role && !s.contacts.some((c) => c.roleId === role)) return false;
        if (!ql) return true;
        return (
          s.name.toLowerCase().includes(ql) || s.area.toLowerCase().includes(ql) || s.city.toLowerCase().includes(ql) || s.notes.toLowerCase().includes(ql) ||
          s.contacts.some((c) => c.name.toLowerCase().includes(ql) || (qd.length >= 3 && c.phone.replace(/\D/g, "").includes(qd)))
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [db.sites, q, city, role]);

  const remove = async (s: Site) => {
    if (!(await confirm({ title: t("deleteSite"), message: t("deleteSiteConfirm", { name: s.name }) }))) return;
    if (await commit({ remove: { sites: [s.id] } })) notify(t("deleted"));
  };

  const toLead = (s: Site) => {
    const c = s.contacts[0];
    const co = lk.companyById.get(s.companyId);
    openLeadForm({
      defaults: {
        companyId: co?.id ?? "",
        companyName: co?.name ?? "",
        projectName: s.name,
        projectLocation: [s.area, s.city].filter(Boolean).join(", "),
        city: s.city,
        contactName: c?.name ?? "",
        phone: c?.phone ?? "",
        whatsapp: c?.phone ?? "",
        jobTitle: c ? name(lk.optById.get(c.roleId)) : "",
        description: [mapsLink(s) && `${t("googleMapsLink")}: ${mapsLink(s)}`, s.notes].filter(Boolean).join("\n"),
      },
    });
  };

  const exportCsv = () => {
    if (!rows.length) return notify(t("nothingToExport"), "error");
    exportTableCSV(
      [t("siteName"), t("city"), t("siteArea"), t("googleMapsLink"), t("clientCompany"), t("siteContacts"), t("visitDate"), t("notes")],
      rows.map((s) => [s.name, s.city, s.area, mapsLink(s), lk.companyById.get(s.companyId)?.name ?? "", s.contacts.map((c) => `${c.name} (${name(lk.optById.get(c.roleId))}) ${c.phone}`).join(" | "), s.visitDate, s.notes]),
      `sites-${today()}.csv`,
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("navSites")} subtitle={t("sitesSubtitle", { n: rows.length })}
        actions={<><Button variant="outline" onClick={exportCsv}>{t("export")} CSV</Button><Button variant="bronze" onClick={() => setForm({ open: true })}><Plus /> {t("newSite")}</Button></>} />
      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="relative"><Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" /><Input className="ps-8" placeholder={t("searchSites")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} /></div>
          <Select value={city} onChange={(e) => setCity(e.target.value)} aria-label={t("city")}><option value="">{t("allCities")}</option>{[...new Set(db.sites.map((s) => s.city).filter(Boolean))].sort().map((c) => <option key={c}>{c}</option>)}</Select>
          <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t("contactRole")}><option value="">{t("allRoles")}</option>{lk.opts("siteRole").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card><EmptyState title={db.sites.length ? t("noMatchingSites") : t("noSitesYet")} hint={db.sites.length ? t("tryClearFilters") : t("noSitesHint")} action={!db.sites.length && <Button variant="bronze" onClick={() => setForm({ open: true })}><Plus /> {t("newSite")}</Button>} /></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => {
            const link = mapsLink(s);
            const co = lk.companyById.get(s.companyId);
            return (
              <Card key={s.id}><CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{s.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5 shrink-0" />{[s.area, s.city].filter(Boolean).join(" · ") || "—"}</p>
                    {co && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Building className="size-3 shrink-0" />{co.name}</p>}
                  </div>
                  <Button size="iconSm" variant="ghost" aria-label={t("edit")} onClick={() => setForm({ open: true, id: s.id })}><Pencil /></Button>
                  <Button size="iconSm" variant="ghost" aria-label={t("delete")} className="text-destructive" onClick={() => remove(s)}><Trash2 /></Button>
                </div>
                {link && (
                  <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-bronze/40 bg-accent px-2.5 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/70">
                    <MapPin className="size-4" /> {t("openInMaps")} <ExternalLink className="size-3" />
                  </a>
                )}
                <ul className="space-y-1.5">
                  {s.contacts.length === 0 && <li className="text-sm text-muted-foreground">{t("noSiteContacts")}</li>}
                  {s.contacts.map((c) => {
                    const r = lk.optById.get(c.roleId);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm">
                        {r && <Badge className="bg-secondary">{name(r)}</Badge>}
                        <span className="font-medium">{c.name}</span>
                        <span className="ms-auto flex items-center gap-1">
                          {c.phone && <a href={`tel:${c.phone}`} className="ltr-num inline-flex items-center gap-1 hover:underline"><Phone className="size-3.5" />{formatPhone(c.phone)}</a>}
                          {c.phone && <a href={waLink(c.phone)} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="text-success"><MessageCircle className="size-4" /></a>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {(s.visitDate || s.notes) && <p className="text-xs text-muted-foreground">{s.visitDate && `${t("visitDate")}: ${formatDate(s.visitDate, locale)}`}{s.visitDate && s.notes && " · "}{s.notes}</p>}
                <Button size="sm" variant="outline" onClick={() => toLead(s)}><FilePlus2 /> {t("createLeadFromSite")}</Button>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <SiteForm open={form.open} siteId={form.id} onClose={() => setForm((f) => ({ ...f, open: false }))} />
    </div>
  );
}

function SiteForm({ open, siteId, onClose }: { open: boolean; siteId?: string; onClose: () => void }) {
  const { t, name } = useI18n();
  const { db, commit, notify } = useStore();
  const lk = useLookups();
  const existing = siteId ? db.sites.find((s) => s.id === siteId) : undefined;
  const blank = { name: "", city: "", area: "", mapsUrl: "", lat: null as number | null, lng: null as number | null, companyId: "", visitDate: today(), notes: "", contacts: [] as SiteContact[] };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  const [locating, setLocating] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);

  // reset when the dialog opens for a (different) site
  const key = open ? (siteId ?? "new") : null;
  if (key !== seen) {
    setSeen(key);
    if (open) {
      setErr({});
      setF(existing ? { ...existing } : { ...blank, contacts: [{ id: uid(), name: "", phone: "", roleId: lk.opts("siteRole")[0]?.id ?? "" }] });
    }
  }

  const setContact = (id: string, patch: Partial<SiteContact>) => setF((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const locate = () => {
    if (!navigator.geolocation) return notify(t("geoUnsupported"), "error");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        setF((s) => ({ ...s, lat, lng, mapsUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}` }));
        setLocating(false);
      },
      () => { setLocating(false); notify(t("geoDenied"), "error"); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = t("errRequired");
    if (f.mapsUrl && !isUrl(f.mapsUrl)) e.mapsUrl = t("errUrl");
    f.contacts.forEach((c) => { if (c.phone && !isValidPhone(c.phone)) e["p" + c.id] = t("errPhone"); });
    setErr(e);
    if (Object.keys(e).length) return;
    const n = nowIso();
    const row: Site = {
      ...(existing ?? { id: uid(), createdAt: n }),
      name: f.name.trim(), city: f.city.trim(), area: f.area.trim(), mapsUrl: canonUrl(f.mapsUrl), lat: f.lat, lng: f.lng, companyId: f.companyId, visitDate: f.visitDate, notes: f.notes,
      // drop completely empty contact rows
      contacts: f.contacts.filter((c) => c.name.trim() || c.phone.trim()).map((c) => ({ ...c, name: c.name.trim(), phone: canonPhone(c.phone) })),
      updatedAt: n,
    } as Site;
    if (await commit({ upsert: { sites: [row] } })) { notify(t("saved")); onClose(); }
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} size="lg" title={siteId ? t("editSite") : t("newSite")}
      footer={<><Button variant="outline" onClick={onClose}>{t("cancel")}</Button><Button variant="bronze" onClick={save}>{t("save")}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("siteName")} required error={err.name} className="sm:col-span-2"><Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={t("siteNamePlaceholder")} /></Field>
        <Field label={t("city")}><Input list="site-cities" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /><datalist id="site-cities">{lk.opts("city").map((c) => <option key={c.id} value={c.name} />)}</datalist></Field>
        <Field label={t("siteArea")}><Input value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder={t("siteAreaPlaceholder")} /></Field>
        <Field label={t("googleMapsLink")} error={err.mapsUrl} hint={f.lat !== null ? `${f.lat.toFixed(5)}, ${f.lng?.toFixed(5)}` : t("mapsLinkHint")} className="sm:col-span-2">
          <div className="flex gap-2">
            <Input dir="ltr" placeholder="https://maps.google.com/…" value={f.mapsUrl} onChange={(e) => setF({ ...f, mapsUrl: e.target.value, lat: null, lng: null })} />
            <Button variant="outline" onClick={locate} disabled={locating} className="shrink-0"><Crosshair /> {locating ? t("locating") : t("useMyLocation")}</Button>
          </div>
        </Field>
        <Field label={t("clientCompany")}><Select value={f.companyId} onChange={(e) => setF({ ...f, companyId: e.target.value })}><option value="" />{db.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label={t("visitDate")}><Input type="date" value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} /></Field>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between border-b pb-1"><h4 className="text-xs font-semibold uppercase tracking-wide text-bronze">{t("siteContacts")}</h4>
            <Button size="sm" variant="outline" onClick={() => setF((s) => ({ ...s, contacts: [...s.contacts, { id: uid(), name: "", phone: "", roleId: lk.opts("siteRole")[0]?.id ?? "" }] }))}><Plus /> {t("addContact")}</Button></div>
          {f.contacts.map((c) => (
            <div key={c.id} className="grid gap-2 rounded-md border p-2.5 sm:grid-cols-[10rem_1fr_1fr_auto]">
              <Select value={c.roleId} onChange={(e) => setContact(c.id, { roleId: e.target.value })} aria-label={t("contactRole")}><option value="" />{lk.opts("siteRole").map((o) => <option key={o.id} value={o.id}>{name(o)}</option>)}</Select>
              <Input placeholder={t("name")} value={c.name} onChange={(e) => setContact(c.id, { name: e.target.value })} aria-label={t("name")} />
              <div><Input dir="ltr" type="tel" placeholder="05X XXX XXXX" value={c.phone} onChange={(e) => setContact(c.id, { phone: e.target.value })} aria-label={t("phone")} aria-invalid={!!err["p" + c.id]} />{err["p" + c.id] && <p role="alert" className="mt-1 text-xs text-destructive">{err["p" + c.id]}</p>}</div>
              <Button size="iconSm" variant="ghost" className="self-center text-destructive" aria-label={t("delete")} onClick={() => setF((s) => ({ ...s, contacts: s.contacts.filter((x) => x.id !== c.id) }))}><X /></Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{t("siteRolesHint")}</p>
        </div>
        <Field label={t("notes")} className="sm:col-span-2"><Textarea rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
