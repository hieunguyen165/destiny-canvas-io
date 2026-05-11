import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const GEMINI_KEY = "dctt_gemini_key";
const EVT = "dctt-admin-change";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export function setGeminiKey(key: string) {
  if (key) localStorage.setItem(GEMINI_KEY, key.trim());
  else localStorage.removeItem(GEMINI_KEY);
  emit();
}

export function getGeminiKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(GEMINI_KEY) || undefined;
}

export function useGeminiKey() {
  const [v, setV] = useState<string | undefined>(undefined);
  useEffect(() => {
    const sync = () => setV(localStorage.getItem(GEMINI_KEY) || undefined);
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return v;
}

/** Returns true when current Supabase user has admin role. */
export function useIsAdmin() {
  const [v, setV] = useState(false);
  useEffect(() => {
    let cancel = false;
    const check = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (!cancel) setV(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!cancel) setV(!!data);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  return v;
}
