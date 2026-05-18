import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

const attachAuthHeader = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const headers: Record<string, string> = {};
  try {
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) headers.authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return next({ headers });
});

const inputSchema = z.object({
  topic: z.string().min(3).max(200),
  primaryKeyword: z.string().max(120).optional().default(""),
  tone: z.enum(["chuyen-sau", "thuc-dung", "huyen-bi"]).optional().default("chuyen-sau"),
  length: z.enum(["ngan", "trung", "dai"]).optional().default("trung"),
});

function extractJson(text: string): any | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = cleaned.indexOf("{");
  const e = cleaned.lastIndexOf("}");
  if (s === -1 || e <= s) return null;
  try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { return null; }
}

export const generateSeoPost = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    // Admin check
    const { data: role } = await ctx.supabase
      .from("user_roles").select("role")
      .eq("user_id", ctx.userId).eq("role", "admin").maybeSingle();
    if (!role) return { ok: false as const, error: "Chỉ quản trị viên mới được dùng tính năng này." };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false as const, error: "LOVABLE_API_KEY chưa cấu hình" };

    const wordTarget = data.length === "ngan" ? "700-900" : data.length === "dai" ? "1800-2400" : "1200-1600";
    const toneDesc = data.tone === "thuc-dung"
      ? "thực dụng, dễ áp dụng, ví dụ gần gũi đời sống"
      : data.tone === "huyen-bi"
      ? "huyền bí, cổ phong, dùng thuật ngữ tử vi - phong thuỷ - can chi"
      : "chuyên sâu, học thuật nhẹ nhàng, dẫn giải gốc tích Đông phương";

    const prompt = `Bạn là chuyên gia SEO content tiếng Việt mảng Tử Vi - Phong Thuỷ - Tâm Linh Đông phương, hiểu rõ Google E-E-A-T và search intent người Việt.

Hãy viết một bài blog CHUẨN SEO về chủ đề: "${data.topic}".
${data.primaryKeyword ? `Từ khoá chính cần tối ưu: "${data.primaryKeyword}".` : ""}
Văn phong: ${toneDesc}. Độ dài: ${wordTarget} từ.

YÊU CẦU SEO:
- Tiêu đề (title) ≤ 60 ký tự, chứa từ khoá chính, có chữ số hoặc ngoặc gây tò mò khi phù hợp.
- meta_description 140-160 ký tự, có từ khoá chính + CTA.
- excerpt 1-2 câu hấp dẫn (≤ 200 ký tự).
- keywords: 5-8 từ khoá liên quan, phân tách dấu phẩy.
- Nội dung Markdown: dùng ## cho H2, ### cho H3. Có:
  + Mở bài ngắn 2-3 câu hook.
  + 4-7 phần ## H2 đặt câu hỏi hoặc keyword-rich.
  + Ít nhất 2 phần có bullet list (-) hoặc bảng | … |.
  + 1 phần "## Câu hỏi thường gặp" với 3-5 cặp Q&A (Q in đậm).
  + Kết bài kêu gọi tra cứu Tử Vi / Vận Mệnh.
- Từ khoá phụ phân bổ tự nhiên, KHÔNG nhồi nhét.

CHỈ trả về JSON thuần (không markdown fence) theo schema:
{
  "title": "...",
  "slug": "duong-dan-khong-dau",
  "excerpt": "...",
  "meta_title": "...",
  "meta_description": "...",
  "keywords": "tu khoa 1, tu khoa 2, ...",
  "content": "## H2...\\n\\n nội dung markdown đầy đủ ..."
}`;

    try {
      const provider = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: provider("google/gemini-2.5-pro"),
        prompt,
        maxOutputTokens: 8192,
      });
      const json = extractJson(text);
      if (!json || !json.content) return { ok: false as const, error: "AI không trả về nội dung hợp lệ. Mời thử lại." };
      return {
        ok: true as const,
        post: {
          title: String(json.title ?? data.topic).slice(0, 200),
          slug: String(json.slug ?? "").slice(0, 90),
          excerpt: String(json.excerpt ?? "").slice(0, 400),
          meta_title: String(json.meta_title ?? json.title ?? "").slice(0, 120),
          meta_description: String(json.meta_description ?? "").slice(0, 200),
          keywords: String(json.keywords ?? "").slice(0, 300),
          content: String(json.content ?? ""),
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false as const, error: msg };
    }
  });
