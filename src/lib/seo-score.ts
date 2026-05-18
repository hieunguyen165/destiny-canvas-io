// SEO scoring helpers — heuristic, hiển thị cho tác giả.

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  content: string;
  coverUrl: string;
};

export type SeoCheck = { id: string; label: string; ok: boolean; hint?: string };

export function readingTimeMin(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function analyzeSeo(p: SeoInput): { score: number; checks: SeoCheck[] } {
  const c = p.content || "";
  const words = c.trim().split(/\s+/).filter(Boolean).length;
  const h2 = (c.match(/^##\s+/gm) || []).length;
  const h3 = (c.match(/^###\s+/gm) || []).length;
  const lists = (c.match(/^\s*[-*]\s+/gm) || []).length;
  const links = (c.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
  const images = (c.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const mt = (p.metaTitle || p.title).trim();
  const md = (p.metaDescription || p.excerpt).trim();
  const kw = (p.keywords || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const primary = kw[0] || "";
  const lc = c.toLowerCase();
  const titleLc = (p.title || "").toLowerCase();

  const checks: SeoCheck[] = [
    { id: "title-len", label: "Tiêu đề 30–60 ký tự", ok: p.title.length >= 30 && p.title.length <= 60, hint: `${p.title.length}/60` },
    { id: "slug", label: "Slug hợp lệ (không dấu, ngắn gọn)", ok: /^[a-z0-9-]{3,90}$/.test(p.slug), hint: p.slug || "(trống)" },
    { id: "meta-title", label: "Meta title 30–60 ký tự", ok: mt.length >= 30 && mt.length <= 60, hint: `${mt.length}/60` },
    { id: "meta-desc", label: "Meta description 120–160 ký tự", ok: md.length >= 120 && md.length <= 160, hint: `${md.length}/160` },
    { id: "kw", label: "Có ≥ 3 từ khoá", ok: kw.length >= 3, hint: `${kw.length} từ khoá` },
    { id: "kw-in-title", label: "Từ khoá chính xuất hiện trong tiêu đề", ok: !!primary && titleLc.includes(primary), hint: primary ? `"${primary}"` : "thiếu từ khoá" },
    { id: "kw-in-body", label: "Từ khoá chính xuất hiện trong nội dung", ok: !!primary && lc.includes(primary) },
    { id: "words", label: "Nội dung ≥ 600 từ", ok: words >= 600, hint: `${words} từ` },
    { id: "h2", label: "Có ≥ 3 tiêu đề ## H2", ok: h2 >= 3, hint: `${h2} H2 · ${h3} H3` },
    { id: "list", label: "Có ít nhất 1 danh sách (-)", ok: lists >= 3 },
    { id: "img", label: "Có ảnh trong bài (cải thiện hấp dẫn)", ok: images >= 1 || !!p.coverUrl, hint: `${images} ảnh trong bài` },
    { id: "link", label: "Có ≥ 1 liên kết tham khảo", ok: links >= 1 },
    { id: "cover", label: "Có ảnh bìa (OG image)", ok: !!p.coverUrl.trim() },
    { id: "excerpt", label: "Có đoạn tóm tắt", ok: p.excerpt.trim().length >= 60 },
  ];
  const passed = checks.filter((x) => x.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks };
}
