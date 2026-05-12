import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/** Client middleware: attach current Supabase user's JWT into Authorization header
 *  so server-side `requireSupabaseAuth` can validate it. */
export const attachAuthHeader = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const headers: Record<string, string> = {};
  try {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return next({ headers });
});
