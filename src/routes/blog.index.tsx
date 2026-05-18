import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Newspaper, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  published_at: string | null;
};

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog Tử Vi & Phong Thuỷ — Hệ Thống Thần Cơ" },
      { name: "description", content: "Bài viết chuyên sâu về Tử Vi Đẩu Số, Vận Mệnh, Hoàng Đạo, Lịch Âm và Phong Thuỷ Đông phương theo phương pháp Diễn Cầm Tam Thế." },
      { property: "og:title", content: "Blog Tử Vi & Phong Thuỷ — Hệ Thống Thần Cơ" },
      { property: "og:description", content: "Bài viết chuyên sâu về Tử Vi Đẩu Số, Vận Mệnh, Hoàng Đạo, Lịch Âm và Phong Thuỷ Đông phương." },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [posts, setPosts] = useState<PostListItem[] | null>(null);

  useEffect(() => {
    supabase
      .from("posts")
      .select("id,slug,title,excerpt,cover_url,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => setPosts((data as PostListItem[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Newspaper className="h-3.5 w-3.5" />Blog Thần Cơ
        </div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          <span className="text-gradient">Tinh Hoa Huyền Học</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-foreground/75">
          Bài viết chuyên sâu về Tử Vi Đẩu Số, Vận Mệnh, Hoàng Đạo và Lịch Âm — soi tỏ vận trình theo tinh thần Đông phương cổ truyền.
        </p>
      </div>

      {posts === null && <p className="text-center text-muted-foreground">Đang tải bài viết…</p>}
      {posts && posts.length === 0 && (
        <Card className="glass-card p-10 text-center shadow-soft">
          <Newspaper className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Chưa có bài viết nào được đăng.</p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((p) => (
          <Link
            key={p.id}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group block overflow-hidden rounded-2xl border border-border/60 bg-background/60 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
          >
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.title} className="aspect-video w-full object-cover" loading="lazy" />
            ) : (
              <div className="aspect-video w-full bg-gradient-to-br from-primary/15 to-accent/30" />
            )}
            <div className="p-5">
              {p.published_at && (
                <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(p.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </div>
              )}
              <h2 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                {p.title}
              </h2>
              {p.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{p.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
