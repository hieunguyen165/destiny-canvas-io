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
