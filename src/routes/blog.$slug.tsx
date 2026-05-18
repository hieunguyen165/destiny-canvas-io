import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Prose } from "@/components/prose";
import { Button } from "@/components/ui/button";

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
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Bài viết — Hệ Thống Thần Cơ" }] };
    const title = p.meta_title || p.title;
    const desc = p.meta_description || p.excerpt || "";
    return {
      meta: [
        { title: `${title} — Hệ Thống Thần Cơ` },
        { name: "description", content: desc },
        ...(p.keywords ? [{ name: "keywords", content: p.keywords }] : []),
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p.cover_url ? [
          { property: "og:image", content: p.cover_url },
          { name: "twitter:image", content: p.cover_url },
          { name: "twitter:card", content: "summary_large_image" },
        ] : []),
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
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/blog"><ChevronLeft className="mr-1.5 h-4 w-4" />Tất cả bài viết</Link>
      </Button>

      <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>

      {post.published_at && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(post.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      )}

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
    </article>
  );
}
