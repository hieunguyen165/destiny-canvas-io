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

/** Lưu/đọc nhiều khoá cấu hình footer/thông tin web (chỉ admin mới ghi được nhờ RLS). */
export async function setAppSetting(key: string, value: string) {
  const trimmed = value;
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value: trimmed, updated_by: u.user?.id, updated_at: new Date().toISOString() });
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export function useAppSettings(keys: string[]) {
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancel = false;
    const load = async () => {
      const { data } = await supabase.from("app_settings").select("key,value").in("key", keys);
      if (cancel) return;
      const out: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string | null }) => { out[r.key] = r.value ?? ""; });
      setVals(out);
    };
    load();
    const onLocal = () => load();
    if (typeof window !== "undefined") window.addEventListener(EVT, onLocal);
    const channel = supabase
      .channel("app_settings-multi-sync-" + keys.join("_"))
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => load())
      .subscribe();
    return () => {
      cancel = true;
      if (typeof window !== "undefined") window.removeEventListener(EVT, onLocal);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(",")]);
  return vals;
}

/** Hook: trả khoá Gemini dùng chung từ DB, tự đồng bộ realtime khi admin đổi. */
export function useGeminiKey() {
  const [v, setV] = useState<string | undefined>(undefined);
  useEffect(() => {
    let cancel = false;
    const load = () => fetchKey().then((k) => { if (!cancel) setV(k); });
    load();

    const onLocal = () => load();
    if (typeof window !== "undefined") window.addEventListener(EVT, onLocal);

    return () => {
      cancel = true;
      if (typeof window !== "undefined") window.removeEventListener(EVT, onLocal);
    };
  }, []);
  return v;
}

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

    supabase.auth.getSession().then(({ data }) => {
      if (!cancel) checkFor(data.session?.user.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setTimeout(() => { if (!cancel) checkFor(uid); }, 0);
    });

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

/** Hook: trả số điểm hiện tại của user (null nếu chưa đăng nhập). Tự refresh khi profile đổi. */
export function useMyPoints() {
  const [points, setPoints] = useState<number | null>(null);
  useEffect(() => {
    let cancel = false;
    let uid: string | null = null;

    const load = async (id: string | null) => {
      if (!id) { if (!cancel) setPoints(null); return; }
      const { data } = await supabase.from("profiles").select("points").eq("id", id).maybeSingle();
      if (!cancel) setPoints(data?.points ?? 0);
    };

    supabase.auth.getSession().then(({ data }) => {
      uid = data.session?.user.id ?? null;
      load(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      uid = s?.user.id ?? null;
      setTimeout(() => load(uid), 0);
    });

    const ch = supabase
      .channel("profile-points-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        if (uid && (payload.new as { id?: string })?.id === uid) load(uid);
      })
      .subscribe();

    return () => { cancel = true; sub.subscription.unsubscribe(); supabase.removeChannel(ch); };
  }, []);
  return points;
}

/** Trừ điểm cho user hiện tại; trả về số dư mới hoặc throw. */
export async function spendPoints(amount: number, reason: string): Promise<number> {
  const { data, error } = await supabase.rpc("spend_points", { _amount: amount, _reason: reason });
  if (error) throw error;
  return data as number;
}
