import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Prose } from "@/components/prose";
import { CostBadge, useCostLabel } from "@/components/cost-badge";
import { SeoSection } from "@/components/seo-section";
import { useMyPoints } from "@/lib/admin";
import { useCosts } from "@/lib/costs";
import { doiLich } from "@/lib/tuvi.functions";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lich-am")({
  head: () => ({
    meta: [
      { title: "Lịch Âm — Đổi Dương Sang Âm, Xem Can Chi & Tiết Khí | Thần Cơ" },
      { name: "description", content: "Tra cứu lịch âm online, đổi ngày dương lịch sang âm lịch, xem can chi ngày tháng năm, tiết khí, ngày hoàng đạo hắc đạo." },
      { property: "og:title", content: "Tra Cứu Lịch Âm Online" },
      { property: "og:description", content: "Đổi Dương ↔ Âm và xem can chi từng ngày." },
    ],
  }),
  component: LichAmPage,
});

function LichAmPage() {
  const fn = useServerFn(doiLich);
  const today = new Date();
  const [chieu, setChieu] = useState<"d2a" | "a2d">("d2a");
  const [ngay, setNgay] = useState(String(today.getDate()));
  const [thang, setThang] = useState(String(today.getMonth() + 1));
  const [nam, setNam] = useState(String(today.getFullYear()));
  const points = useMyPoints();
  const costs = useCosts();
  const cost = costs.lich_am ?? 0;
  const costLabel = useCostLabel("lich_am");

  const m = useMutation({
    mutationFn: (v: { ngay: number; thang: number; nam: number; chieu: "d2a" | "a2d" }) => fn({ data: v }),
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

  const handleClick = () => {
    if (cost > 0 && points === null) { toast.error(`Vui lòng đăng nhập để đổi lịch (${costLabel}/lần).`); return; }
    if (cost > 0 && points !== null && points < cost) { toast.error(`Không đủ điểm! Cần ${costLabel}.`); return; }
    m.mutate({ ngay: Number(ngay), thang: Number(thang), nam: Number(nam), chieu });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Calendar className="h-3 w-3" /> Lịch Vạn Niên
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          <span className="text-gradient">Lịch Âm</span> · Đổi Dương ↔ Âm
        </h1>
      </div>

      <Card className="glass-card mt-8 p-6 sm:p-8 shadow-elegant">
        <Label className="mb-2 block text-sm font-medium">Chiều đổi</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["d2a", "a2d"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChieu(c)}
              className={cn(
                "rounded-lg border px-4 py-3 text-sm font-semibold transition-all",
                chieu === c ? "border-primary/40 bg-primary/10 text-primary shadow-soft" : "border-border bg-background/60 hover:border-primary/30",
              )}
            >
              {c === "d2a" ? "Dương → Âm" : "Âm → Dương"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1.5 text-xs">Ngày</Label>
            <Input inputMode="numeric" value={ngay} onChange={(e) => setNgay(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs">Tháng</Label>
            <Input inputMode="numeric" value={thang} onChange={(e) => setThang(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 text-xs">Năm</Label>
            <Input inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-2">
          <div className="flex justify-end"><CostBadge costKey="lich_am" /></div>
          <Button
            onClick={handleClick}
            disabled={m.isPending}
            size="lg"
            className="gradient-primary w-full text-primary-foreground shadow-elegant"
          >
            {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đổi…</> : `Đổi lịch · ${costLabel}`}
          </Button>
        </div>
      </Card>

      {m.data?.ok && m.data.content && (
        <Card className="glass-card mt-8 p-6 sm:p-8 shadow-elegant">
          <Prose content={m.data.ok ? m.data.content : ""} />
        </Card>
      )}

      <SeoSection
        title="Tra cứu lịch âm Việt Nam — đổi ngày dương sang âm chuẩn xác"
        intro="Lịch âm (âm dương lịch) là loại lịch truyền thống của người Việt, kết hợp chu kỳ Mặt Trăng (tháng âm) và Mặt Trời (tiết khí). Người Việt dùng lịch âm để xem ngày cúng giỗ, lễ Tết, cưới hỏi, động thổ — biết can chi của ngày, tháng, năm là yếu tố cốt lõi của tử vi và phong thuỷ."
        blocks={[
          { heading: "Đổi ngày dương sang âm để làm gì?", body: "Để biết ngày âm chính xác cho cúng giỗ, sinh nhật âm, ngày Rằm, mùng Một; xem can chi để chọn ngày tốt; tra tiết khí để hiểu khí hậu nông nghiệp." },
          { heading: "Can chi ngày, tháng, năm là gì?", body: "Mỗi đơn vị thời gian có một cặp Can (10 thiên can) - Chi (12 địa chi). Ví dụ năm Giáp Tý, tháng Bính Dần, ngày Quý Mão — tổ hợp này quyết định ngũ hành và cát hung của ngày." },
          { heading: "24 tiết khí trong lịch âm dương", body: "Từ Lập Xuân, Vũ Thuỷ, Kinh Trập… đến Đại Hàn — 24 tiết khí phân chia một năm theo vị trí Mặt Trời, hướng dẫn nông vụ và cũng dùng để tính tử vi tử bình." },
          { heading: "Ngày hoàng đạo và hắc đạo", body: "Trong mỗi tháng âm có 6 ngày hoàng đạo (cát) và 6 ngày hắc đạo (kỵ) theo Trực và Sao chiếu. Biết ngày hoàng đạo giúp chọn thời điểm khởi sự công việc." },
        ]}
        faqs={[
          { q: "Lịch âm và lịch âm dương khác gì nhau?", a: "Lịch Việt thực chất là âm dương lịch — tháng tính theo Mặt Trăng, năm điều chỉnh theo Mặt Trời (qua tháng nhuận và 24 tiết khí)." },
          { q: "Vì sao có năm nhuận trong lịch âm?", a: "Để đồng bộ chu kỳ Mặt Trăng với chu kỳ Mặt Trời, khoảng 3 năm có 1 năm nhuận với 13 tháng âm." },
          { q: "Sinh nhật nên xem theo lịch âm hay dương?", a: "Tuỳ truyền thống gia đình. Theo phong tục Việt, ngày giỗ luôn dùng lịch âm; sinh nhật có thể dùng dương cho tiện nhưng tử vi vẫn căn theo âm." },
        ]}
      />
    </div>
  );
}
