import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin check. Sử dụng requireSupabaseAuth để xác thực JWT,
 * sau đó kiểm tra role 'admin' trong bảng user_roles bằng client đã có session.
 * Trả về { isAdmin: boolean } — không bao giờ throw redirect ở đây để loader
 * có thể tự xử lý.
 */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return { isAdmin: false };
    return { isAdmin: !!data };
  });
