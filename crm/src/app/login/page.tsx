"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabaseConfigured } from "@/lib/store/adapter";
import { getSupabase } from "@/lib/store/supabase";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const enabled = supabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message);
    else router.replace("/");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-sidebar p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{t("appName")}</div>
            <div className="text-sm text-muted-foreground">{t("signInSubtitle")}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            {lang === "en" ? "العربية" : "English"}
          </Button>
        </div>
        {enabled ? (
          <form onSubmit={submit} className="grid gap-3">
            <Field label={t("email")}>
              <Input type="email" dir="ltr" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t("password")} error={err}>
              <Input type="password" dir="ltr" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button type="submit" variant="bronze" disabled={busy}>
              {t("signIn")}
            </Button>
          </form>
        ) : (
          <div className="grid gap-3 text-sm">
            <p>{t("loginLocalMode")}</p>
            <Button variant="bronze" onClick={() => router.replace("/")}>
              {t("openApp")}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
