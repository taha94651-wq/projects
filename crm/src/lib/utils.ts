import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

export const nowIso = () => new Date().toISOString();

/** Local calendar date as YYYY-MM-DD (not UTC, so "today" is correct in Riyadh). */
export function toDateStr(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export const today = () => toDateStr();

export function addDays(date: string | Date, days: number): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function daysBetween(a: string, b: string): number {
  const A = new Date(a + "T00:00:00").getTime();
  const B = new Date(b + "T00:00:00").getTime();
  return Math.round((B - A) / 86400000);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function formatMoney(n: number | null | undefined, currency = "SAR", locale = "en-US"): string {
  const v = n ?? 0;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${Math.round(v).toLocaleString()}`;
  }
}

export function formatCompact(n: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatDate(s: string | undefined, locale = "en-GB"): string {
  if (!s) return "—";
  const d = new Date(s.length <= 10 ? s + "T00:00:00" : s);
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function formatDateTime(s: string | undefined, locale = "en-GB"): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Saudi mobile: +966 5X XXX XXXX. Returns normalised E.164-ish string or "" if not parsable. */
export function normalizeSaudiPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return "";
  let d = digits.replace(/^\+/, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("966")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  return d ? "+966" + d : "";
}

/** Valid Saudi mobile (5XXXXXXXX) or landline (1/2/3/4/6/7/8 + 7 digits) or generic international. */
export function isValidPhone(raw: string): boolean {
  if (!raw.trim()) return true;
  const s = raw.replace(/[\s\-().]/g, "");
  if (!/^\+?\d{7,15}$/.test(s)) return false;
  const n = normalizeSaudiPhone(s);
  if (s.startsWith("+") && !s.startsWith("+966") && !s.startsWith("00966")) return true; // foreign number
  const local = n.replace("+966", "");
  return /^5\d{8}$/.test(local) || /^[1-46-9]\d{7}$/.test(local) || /^800\d{7}$/.test(local);
}

export function formatPhone(raw: string): string {
  if (!raw) return "";
  const n = normalizeSaudiPhone(raw);
  const local = n.replace("+966", "");
  if (/^5\d{8}$/.test(local)) return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  return raw;
}

export function waLink(raw: string): string {
  const n = normalizeSaudiPhone(raw).replace("+", "");
  return n ? `https://wa.me/${n}` : "";
}

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٟ]/g, "") // arabic diacritics
    .replace(/\b(co|company|ltd|llc|est|establishment|trading|group|contracting|شركة|مؤسسة)\b\.?/g, "")
    .replace(/[^a-z0-9؀-ۿ]/g, "");
}

export function isUrl(s: string): boolean {
  if (!s.trim()) return true;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : "https://" + s);
    return !!u.hostname.includes(".");
  } catch {
    return false;
  }
}
export const isEmail = (s: string) => !s.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

export function sum<T>(arr: T[], f: (x: T) => number): number {
  return arr.reduce((a, x) => a + (f(x) || 0), 0);
}

export function groupBy<T>(arr: T[], key: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const x of arr) (out[key(x)] ||= []).push(x);
  return out;
}

export function download(filename: string, data: BlobPart, type = "text/plain;charset=utf-8") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Canonical stored phone: Saudi numbers -> +966XXXXXXXXX, other international numbers keep their + prefix. */
export function canonPhone(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  const compact = s.replace(/[\s\-().]/g, "");
  if (compact.startsWith("+") && !compact.startsWith("+966")) return compact;
  if (compact.startsWith("00") && !compact.startsWith("00966")) return "+" + compact.slice(2);
  return normalizeSaudiPhone(compact);
}

export function canonUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}
