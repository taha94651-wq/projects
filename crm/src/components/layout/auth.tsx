"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabaseConfigured } from "@/lib/store/adapter";
import { getSupabase } from "@/lib/store/supabase";
import { Spinner } from "@/components/ui/card";

interface AuthValue {
  email: string;
  signOut: () => Promise<void>;
  enabled: boolean;
}
const Ctx = createContext<AuthValue>({ email: "", signOut: async () => {}, enabled: false });
export const useAuth = () => useContext(Ctx);

/** Local mode: no auth (data never leaves the browser). Supabase mode: a signed-in session is required. */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const enabled = supabaseConfigured();
  const [state, setState] = useState<"loading" | "in">(enabled ? "loading" : "in");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const sb = getSupabase();
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) router.replace("/login");
      else {
        setEmail(data.session.user.email ?? "");
        setState("in");
      }
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
      else setEmail(session.user.email ?? "");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled, router]);

  if (state === "loading")
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
      </div>
    );
  return (
    <Ctx.Provider value={{ email, enabled, signOut: async () => { await getSupabase().auth.signOut(); router.replace("/login"); } }}>
      {children}
    </Ctx.Provider>
  );
}
