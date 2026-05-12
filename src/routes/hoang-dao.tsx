import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Prose } from "@/components/prose";
import { CostBadge, useCostLabel } from "@/components/cost-badge";
import { SeoSection } from "@/components/seo-section";
import { useMyPoints } from "@/lib/admin";
import { useCosts } from "@/lib/costs";
import { luanCungHoangDao } from "@/lib/tuvi.functions";


export const Route = createFileRoute("/hoang-dao")({
  head: () => ({
    meta: [
      { title: "12 Cung Hoàng Đạo — Tử Vi Tuần Bạch Dương, Sư Tử, Thiên Bình… | Thần Cơ" },
      { name: "description", content: "Xem tử vi tuần cho 12 cung hoàng đạo Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Bọ Cạp, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư." },
      { property: "og:title", content: "Tử Vi 12 Cung Hoàng Đạo Tuần Này" },
      { property: "og:description", content: "Tình yêu, sự nghiệp, tài chính, sức khoẻ cho 12 cung hoàng đạo." },
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
  const [chosen, setChosen] = useState<string | null>(null);
  const points = useMyPoints();
  const costs = useCosts();
  const cost = costs.hoang_dao ?? 0;
  const costLabel = useCostLabel("hoang_dao");

  const m = useMutation({
    mutationFn: (cung: string) => fn({ data: { cung } }),
    onSuccess: (d) => {
      if (d && !d.ok) {
        if (d.error === "insufficient_points") toast.error(`Không đủ điểm! Cần ${cost.toLocaleString("vi-VN")} điểm.`);
        else toast.error(d.error || "AI tạm thời không khả dụng");
      }
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Unauthorized") || msg.includes("401")) toast.error(`Vui lòng đăng nhập (${costLabel}/lần).`);
      else toast.error(msg || "Có lỗi xảy ra");
    },
  });

  const onPick = (cungName: string) => {
    if (cost > 0 && points === null) { toast.error(`Vui lòng đăng nhập để xem (${costLabel}/lần).`); return; }
    if (cost > 0 && points !== null && points < cost) { toast.error(`Không đủ điểm! Cần ${costLabel}.`); return; }
    setChosen(cungName);
    m.mutate(cungName);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          12 <span className="text-gradient">Cung Hoàng Đạo</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Bấm vào cung của bạn để xem tử vi tuần.</p>
        <div className="mt-3 flex justify-center"><CostBadge costKey="hoang_dao" /></div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CUNG.map((c) => (
          <button
            key={c.name}
            onClick={() => onPick(c.name)}
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

      {m.data?.ok && m.data.content && !m.isPending && (
        <Card className="glass-card mt-8 p-6 sm:p-10 shadow-elegant">
          <div className="mb-3 text-sm text-muted-foreground">Tử vi tuần — <strong className="text-foreground">{chosen}</strong></div>
          <Prose content={m.data.ok ? m.data.content : ""} />
        </Card>
      )}

      <SeoSection
        title="Tử vi 12 cung hoàng đạo tuần này — Đông Tây kết hợp"
        intro="Cung hoàng đạo (Zodiac) phản ánh tính cách và xu hướng vận trình theo vị trí mặt trời lúc bạn sinh ra. Khi kết hợp với tử vi cổ truyền phương Đông, bạn có cái nhìn đa chiều hơn về tình yêu, sự nghiệp, tài chính và sức khoẻ trong tuần."
        blocks={[
          { heading: "Cung hoàng đạo lửa: Bạch Dương, Sư Tử, Nhân Mã", body: "Nhóm hành hoả mạnh mẽ, đam mê, hợp các quyết định nhanh — tuần nào cát tinh chiếu thì sự nghiệp bứt phá; gặp hung tinh dễ nóng vội mất tiền." },
          { heading: "Cung hoàng đạo đất: Kim Ngưu, Xử Nữ, Ma Kết", body: "Nhóm hành thổ ổn định, kỷ luật, giỏi tích luỹ tài sản. Tuần này nên tập trung củng cố nền tảng, tránh thay đổi đột ngột về công việc." },
          { heading: "Cung hoàng đạo khí: Song Tử, Thiên Bình, Bảo Bình", body: "Nhóm hành phong nhanh nhạy, khéo giao tiếp; rất hợp tuần có sao truyền thông sáng. Cẩn trọng với tin đồn và hợp đồng vội." },
          { heading: "Cung hoàng đạo nước: Cự Giải, Bọ Cạp, Song Ngư", body: "Nhóm hành thuỷ giàu cảm xúc, trực giác mạnh — chuyện tình cảm nổi rõ; tuần có Mặt Trăng đẹp thì nhân duyên hanh thông." },
        ]}
        faqs={[
          { q: "Cung hoàng đạo và tử vi tuổi (con giáp) khác nhau thế nào?", a: "Cung hoàng đạo dựa trên ngày dương lịch sinh (vị trí mặt trời), còn tử vi 12 con giáp dựa trên năm âm lịch sinh (can chi). Hai hệ thống bổ sung lẫn nhau." },
          { q: "Nên xem tử vi cung hoàng đạo bao lâu một lần?", a: "Mỗi tuần một lần là phù hợp. Tử vi tuần giúp bạn biết những ngày 'thuận' để hành động và những ngày 'nghịch' nên thận trọng." },
          { q: "Tử vi cung hoàng đạo của tôi không trùng tính cách thật, vì sao?", a: "Cung hoàng đạo (Sun sign) chỉ là một phần trong bản đồ sao — còn cung Mặt Trăng, cung Mọc và các hành tinh khác mới tạo nên chân dung đầy đủ." },
        ]}
      />
    </div>
  );
}
