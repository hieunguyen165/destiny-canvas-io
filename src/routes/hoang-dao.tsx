import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Prose } from "@/components/prose";
import { luanCungHoangDao } from "@/lib/tuvi.functions";
import { useGeminiKey } from "@/lib/admin";

export const Route = createFileRoute("/hoang-dao")({
  head: () => ({
    meta: [
      { title: "12 Cung Hoàng Đạo — Hệ Thống Thần Cơ" },
      { name: "description", content: "Xem tử vi tuần cho 12 cung hoàng đạo: tình yêu, sự nghiệp, tài chính, sức khoẻ." },
      { property: "og:title", content: "12 Cung Hoàng Đạo" },
      { property: "og:description", content: "Tử vi hàng tuần cho 12 cung hoàng đạo." },
    ],
  }),
  component: HoangDaoPage,
});

const CUNG = [
  { name: "Bạch Dương", icon: "♈", date: "21/3 – 19/4" },
  { name: "Kim Ngưu", icon: "♉", date: "20/4 – 20/5" },
  { name: "Song Tử", icon: "♊", date: "21/5 – 20/6" },
  { name: "Cự Giải", icon: "♋", date: "21/6 – 22/7" },
  { name: "Sư Tử", icon: "♌", date: "23/7 – 22/8" },
  { name: "Xử Nữ", icon: "♍", date: "23/8 – 22/9" },
  { name: "Thiên Bình", icon: "♎", date: "23/9 – 22/10" },
  { name: "Bọ Cạp", icon: "♏", date: "23/10 – 21/11" },
  { name: "Nhân Mã", icon: "♐", date: "22/11 – 21/12" },
  { name: "Ma Kết", icon: "♑", date: "22/12 – 19/1" },
  { name: "Bảo Bình", icon: "♒", date: "20/1 – 18/2" },
  { name: "Song Ngư", icon: "♓", date: "19/2 – 20/3" },
];

function HoangDaoPage() {
  const fn = useServerFn(luanCungHoangDao);
  const geminiKey = useGeminiKey();
  const [chosen, setChosen] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: (cung: string) => fn({ data: { cung, geminiKey } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          12 <span className="text-gradient">Cung Hoàng Đạo</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Bấm vào cung của bạn để xem tử vi tuần.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CUNG.map((c) => (
          <button
            key={c.name}
            onClick={() => { setChosen(c.name); m.mutate(c.name); }}
            className={`group rounded-xl border bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant ${chosen === c.name ? "border-primary/50 shadow-elegant" : "border-border"}`}
          >
            <div className="text-3xl text-gradient-gold">{c.icon}</div>
            <div className="mt-2 font-display text-lg font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.date}</div>
          </button>
        ))}
      </div>

      {m.isPending && (
        <Card className="glass-card mt-8 p-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 font-display text-lg">Đang luận tử vi cho cung {chosen}…</p>
        </Card>
      )}

      {m.data?.content && !m.isPending && (
        <Card className="glass-card mt-8 p-6 sm:p-10 shadow-elegant">
          <div className="mb-3 text-sm text-muted-foreground">Tử vi tuần — <strong className="text-foreground">{chosen}</strong></div>
          <Prose content={m.data.content} />
        </Card>
      )}
    </div>
  );
}
