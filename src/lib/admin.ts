import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SETTING_KEY = "gemini_api_key";
const EVT = "dctt-admin-change";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

/** Admin-only: lưu khoá Gemini dùng chung cho TẤT CẢ user vào DB. */
export async function setGeminiKey(key: string) {
  const trimmed = key.trim();
  if (trimmed) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: SETTING_KEY, value: trimmed, updated_by: u.user?.id, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("app_settings").delete().eq("key", SETTING_KEY);
    if (error) throw error;
  }
  emit();
}

async function fetchKey(): Promise<string | undefined> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
  return data?.value || undefined;
}

/** Hook: trả khoá Gemini dùng chung từ DB, tự đồng bộ realtime khi admin đổi. */
export function useGeminiKey() {
  const [v, setV] = useState<string | undefined>(undefined);
  useEffect(() => {
    let cancel = false;
    const load = () => fetchKey().then((k) => { if (!cancel) setV(k); });
    load();

    const onLocal = () => load();
    window.addEventListener(EVT, onLocal);

    const channel = supabase
      .channel("app_settings-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => load())
      .subscribe();

    return () => {
      cancel = true;
      window.removeEventListener(EVT, onLocal);
      supabase.removeChannel(channel);
    };
  }, []);
  return v;
}

/** Returns admin-role check with loading state. Uses cached session to avoid network round-trip / deadlock. */
export function useIsAdmin() {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean }>({ loading: true, isAdmin: false });
  useEffect(() => {
    let cancel = false;
    let lastUid: string | null | undefined = undefined;

    const checkFor = async (uid: string | null) => {
      if (lastUid === uid) return;
      lastUid = uid;
      if (!uid) {
        if (!cancel) setState({ loading: false, isAdmin: false });
        return;
      }
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();
        if (!cancel) setState({ loading: false, isAdmin: !!data });
      } catch {
        if (!cancel) setState({ loading: false, isAdmin: false });
      }
    };

    // 1) Use cached session synchronously — no network call, no deadlock.
    supabase.auth.getSession().then(({ data }) => {
      if (!cancel) checkFor(data.session?.user.id ?? null);
    });

    // 2) React to future auth changes; defer DB call out of the callback to avoid Supabase deadlock.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setTimeout(() => { if (!cancel) checkFor(uid); }, 0);
    });

    // 3) Safety net: never stay in loading state forever.
    const timer = setTimeout(() => {
      if (!cancel) setState((s) => (s.loading ? { loading: false, isAdmin: false } : s));
    }, 5000);

    return () => {
      cancel = true;
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}
