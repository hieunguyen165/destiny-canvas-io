import { useEffect, useState } from "react";

const ADMIN_FLAG = "dctt_admin";
const GEMINI_KEY = "dctt_gemini_key";
const EVT = "dctt-admin-change";

export const ADMIN_USER = "Xuanhieufi@gmail.com";
export const ADMIN_PASS = "Admin123@";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVT));
}

export function loginAdmin(user: string, pass: string) {
  if (user.trim().toLowerCase() !== ADMIN_USER.toLowerCase() || pass !== ADMIN_PASS) return false;
  localStorage.setItem(ADMIN_FLAG, "1");
  emit();
  return true;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_FLAG);
  emit();
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

export function useIsAdmin() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const sync = () => setV(localStorage.getItem(ADMIN_FLAG) === "1");
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
