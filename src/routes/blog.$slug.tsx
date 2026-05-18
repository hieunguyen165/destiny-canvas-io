import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Calendar, Clock, Share2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Prose } from "@/components/prose";
import { Button } from "@/components/ui/button";
import { readingTimeMin } from "@/lib/seo-score";
import { toast } from "sonner";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  published_at: string | null;
};

type RelatedPost = { id: string; slug: string; title: string; excerpt: string | null; cover_url: string | null };

const SITE = "https://thanco.io.vn";

async function fetchPost(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from("posts")
    .select("id,slug,title,excerpt,content,cover_url,meta_title,meta_description,keywords,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return (data as Post) ?? null;
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Bài viết — Hệ Thống Thần Cơ" }] };
    const title = p.meta_title || p.title;
    const desc = p.meta_description || p.excerpt || "";
    const url = `${SITE}/blog/${params.slug}`;
    const image = p.cover_url || undefined;

    const articleLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: p.title,
      description: desc,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      inLanguage: "vi-VN",
      author: { "@type": "Organization", name: "Hệ Thống Thần Cơ" },
      publisher: { "@type": "Organization", name: "Hệ Thống Thần Cơ", url: SITE },
      url,
    };
    if (image) articleLd.image = [image];
    if (p.published_at) {
      articleLd.datePublished = p.published_at;
      articleLd.dateModified = p.published_at;
    }
    if (p.keywords) articleLd.keywords = p.keywords;

    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    };

    return {
      meta: [
        { title: `${title} — Hệ Thống Thần Cơ` },
        { name: "description", content: desc },
        ...(p.keywords ? [{ name: "keywords", content: p.keywords }] : []),
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        ...(p.published_at ? [
          { property: "article:published_time", content: p.published_at },
          { property: "article:modified_time", content: p.published_at },
        ] : []),
        ...(image ? [
          { property: "og:image", content: image },
          { name: "twitter:image", content: image },
          { name: "twitter:card", content: "summary_large_image" },
        ] : [{ name: "twitter:card", content: "summary" }]),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(articleLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Không tìm thấy bài viết</h1>
      <p className="mt-2 text-muted-foreground">Bài viết có thể đã bị xoá hoặc chuyển sang nháp.</p>
      <Button asChild className="mt-5"><Link to="/blog">Về danh sách bài viết</Link></Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Có lỗi xảy ra</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const readMin = readingTimeMin(post.content);
  const tags = (post.keywords || "").split(",").map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id,slug,title,excerpt,cover_url")
      .eq("status", "published")
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setRelated((data as RelatedPost[]) ?? []));
  }, [post.id]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : `${SITE}/blog/${post.slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: post.title, text: post.excerpt || "", url }); return; }
      catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); toast.success("Đã sao chép liên kết"); }
    catch { toast.error("Không thể sao chép"); }
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/blog" className="hover:text-primary">Blog</Link>
        <span>/</span>
        <span className="truncate text-foreground/70">{post.title}</span>
      </nav>

      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/blog"><ChevronLeft className="mr-1.5 h-4 w-4" />Tất cả bài viết</Link>
      </Button>

      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {post.published_at && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{readMin} phút đọc</span>
        <button onClick={share} className="inline-flex items-center gap-1.5 hover:text-primary">
          <Share2 className="h-3.5 w-3.5" />Chia sẻ
        </button>
      </div>

      {post.cover_url && (
        <img src={post.cover_url} alt={post.title} className="mt-6 aspect-video w-full rounded-2xl object-cover shadow-soft" />
      )}

      {post.excerpt && (
        <p className="mt-6 border-l-4 border-primary/40 bg-primary/5 px-4 py-3 text-lg italic text-foreground/85">
          {post.excerpt}
        </p>
      )}

      <div className="mt-8">
        <Prose content={post.content} />
      </div>

      {tags.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border/60 pt-6">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-foreground/75">#{t}</span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-12 border-t border-border/60 pt-8">
          <h2 className="mb-4 font-display text-xl font-semibold">Bài viết liên quan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group block overflow-hidden rounded-xl border border-border/60 bg-background/60 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
              >
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="aspect-video w-full object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-primary/15 to-accent/30" />
                )}
                <div className="p-3">
                  <h3 className="line-clamp-2 font-display text-sm font-semibold group-hover:text-primary">{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
