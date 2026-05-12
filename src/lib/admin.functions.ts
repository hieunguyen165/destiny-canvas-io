import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

/** Client middleware: gắn JWT của user hiện tại vào header Authorization
 *  để server-side requireSupabaseAuth nhận được token. */
const attachAuthHeader = createMiddleware({ type: "function" }).client(async ({ next }) => {
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

/**
 * Server-side admin check. Yêu cầu JWT hợp lệ; trả { isAdmin: boolean }.
 */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { data } = await ctx.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", ctx.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
