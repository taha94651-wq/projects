"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./en";
import { ar } from "./ar";

export type Lang = "en" | "ar";
export type TKey = keyof typeof en;

const DICT: Record<Lang, Record<string, string>> = { en, ar };

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
  /** Locale used for number/date formatting. English UI keeps Latin digits, Arabic UI uses Arabic-region formatting with Latin digits for IDs/phones. */
  locale: string;
  t: (key: TKey | (string & {}), vars?: Record<string, string | number>) => string;
  /** Localised display name for config items having name / nameAr. */
  name: (x?: { name: string; nameAr?: string } | null) => string;
  label: (x?: { label: string; labelAr?: string } | null) => string;
}

const Ctx = createContext<I18n | null>(null);
export const useI18n = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n outside provider");
  return v;
};

const KEY = "crm-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  const value = useMemo<I18n>(() => {
    const t: I18n["t"] = (key, vars) => {
      let s = DICT[lang][key] ?? DICT.en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    };
    return {
      lang,
      setLang,
      dir: lang === "ar" ? "rtl" : "ltr",
      locale: lang === "ar" ? "ar-SA-u-nu-latn" : "en-GB",
      t,
      name: (x) => (x ? (lang === "ar" && x.nameAr ? x.nameAr : x.name) : ""),
      label: (x) => (x ? (lang === "ar" && x.labelAr ? x.labelAr : x.label) : ""),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
