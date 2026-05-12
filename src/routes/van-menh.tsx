import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Stars } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Prose } from "@/components/prose";
import { CostBadge, useCostLabel } from "@/components/cost-badge";
import { SeoSection } from "@/components/seo-section";
import { useMyPoints } from "@/lib/admin";
import { useCosts } from "@/lib/costs";
import { vanMenh } from "@/lib/tuvi.functions";


export const Route = createFileRoute("/van-menh")({
  head: () => ({
    meta: [
      { title: "Vận Mệnh Năm 2026 — Tử Vi 12 Con Giáp | Hệ Thống Thần Cơ" },
      { name: "description", content: "Xem vận mệnh năm 2026 cho 12 con giáp Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi: tài lộc, công việc, tình duyên, sức khoẻ." },
      { property: "og:title", content: "Vận Mệnh Theo Tuổi 12 Con Giáp" },
      { property: "og:description", content: "Tử vi vận mệnh năm cho 12 con giáp theo lịch can chi Việt Nam." },
    ],
  }),
  component: VanMenhPage,
});

const GIAP = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const ICONS: Record<string, string> = { Tý: "🐭", Sửu: "🐮", Dần: "🐯", Mão: "🐱", Thìn: "🐲", Tỵ: "🐍", Ngọ: "🐴", Mùi: "🐐", Thân: "🐵", Dậu: "🐔", Tuất: "🐶", Hợi: "🐷" };

function VanMenhPage() {
  const fn = useServerFn(vanMenh);
  const [tuoi, setTuoi] = useState("Tý");
  const year = new Date().getFullYear();
  const [nam, setNam] = useState(String(year));
  const points = useMyPoints();
  const costs = useCosts();
  const cost = costs.van_menh ?? 0;
  const costLabel = useCostLabel("van_menh");

  const m = useMutation({
    mutationFn: (v: { conGiap: string; nam: number }) => fn({ data: v }),
    onSuccess: (d) => {
      if (d && !d.ok) {
        if (d.error === "insufficient_points") toast.error(`Không đủ điểm! Cần ${cost.toLocaleString("vi-VN")} điểm.`);
        else toast.error(d.error || "AI tạm thời không khả dụng");
      }
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("Unauthorized") || msg.includes("401")) toast.error(`Vui lòng đăng nhập để xem (${costLabel}/lần).`);
      else toast.error(msg || "Có lỗi xảy ra");
    },
  });

  const handleClick = () => {
    if (cost > 0 && points === null) { toast.error(`Vui lòng đăng nhập để xem (${costLabel}/lần).`); return; }
    if (cost > 0 && points !== null && points < cost) { toast.error(`Không đủ điểm! Cần ${costLabel}.`); return; }
    m.mutate({ conGiap: tuoi, nam: Number(nam) });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Stars className="h-3 w-3" /> 12 con giáp
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          Vận <span className="text-gradient">Mệnh Năm</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn tuổi và năm muốn xem để được luận giải tổng quan.</p>
      </div>

      <Card className="glass-card mt-8 p-6 sm:p-8 shadow-elegant">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
          {GIAP.map((g) => (
            <button
              key={g}
              onClick={() => setTuoi(g)}
              className={`flex flex-col items-center rounded-lg border p-2 text-xs font-semibold transition-all ${tuoi === g ? "border-primary/50 bg-primary/10 text-primary shadow-soft" : "border-border bg-background/60 hover:border-primary/30"}`}
            >
              <span className="text-lg">{ICONS[g]}</span>
              <span>{g}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label className="mb-1.5 block text-sm font-medium">Năm xem</Label>
            <Select value={nam} onValueChange={setNam}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => year + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <CostBadge costKey="van_menh" />
            <Button
              onClick={handleClick}
              disabled={m.isPending}
              size="lg"
              className="gradient-primary text-primary-foreground shadow-elegant"
            >
              {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xem…</> : <>Xem vận mệnh tuổi {tuoi} · {costLabel}</>}
            </Button>
          </div>
        </div>
      </Card>

      {m.data?.ok && m.data.content && (
        <Card className="glass-card mt-8 p-6 sm:p-10 shadow-elegant">
          <div className="mb-3 text-sm text-muted-foreground">
            Vận mệnh năm <strong className="text-foreground">{nam}</strong> cho người tuổi <strong className="text-foreground">{tuoi}</strong>
          </div>
          <Prose content={m.data.ok ? m.data.content : ""} />
        </Card>
      )}

      <SeoSection
        title="Xem vận mệnh năm theo 12 con giáp Việt Nam"
        intro="Vận mệnh năm là bức tranh tổng quan về tài lộc, công danh, tình duyên và sức khoẻ của một người trong một niên hạn. Theo tử vi cổ truyền Việt Nam, mỗi tuổi (con giáp) phối hợp với can chi của năm sẽ tạo ra cát hung khác nhau — biết trước để đón lành tránh dữ, gọi là 'tri mệnh'."
        blocks={[
          { heading: "Tử vi tuổi Tý, Sửu, Dần, Mão", body: "Bốn tuổi này có khí chất khác biệt: Tý nhanh nhạy về tài, Sửu vững vàng điền trạch, Dần thiên về công danh, Mão tinh tế trong giao tiếp. Mỗi năm có sao chiếu mệnh khác nhau — cần xem cụ thể theo can chi năm." },
          { heading: "Vận mệnh tuổi Thìn, Tỵ, Ngọ, Mùi", body: "Thìn được coi là tuổi rồng, dễ phát về quyền uy; Tỵ tinh khôn, hợp công việc trí tuệ; Ngọ năng động, nhiều cơ hội đi xa; Mùi điềm đạm, phúc đức dày." },
          { heading: "Tử vi tuổi Thân, Dậu, Tuất, Hợi", body: "Thân khéo léo và đa tài; Dậu cẩn trọng, hợp việc cần độ chính xác; Tuất trung hậu, được lòng người; Hợi đôn hậu, hậu vận sung túc nếu biết tích đức." },
          { heading: "Cách xem tử vi vận mệnh năm chuẩn xác", body: "Để xem vận mệnh năm chuẩn theo tử vi cổ truyền, cần phối hợp can chi tuổi với can chi năm, xét sao Thái Tuế, Tam Hợp - Lục Hợp, các sao cát tinh và hung tinh chiếu mệnh. Hệ thống Thần Cơ tự động tính toán theo phương pháp Diễn Cẩm Tam Thế." },
        ]}
        faqs={[
          { q: "Xem vận mệnh năm có chính xác không?", a: "Tử vi mang tính tham khảo dưới góc nhìn văn hoá phương Đông, giúp định hướng để chủ động đón lành tránh dữ — không phải định mệnh tuyệt đối." },
          { q: "Bao lâu nên xem vận mệnh một lần?", a: "Thông thường xem đầu năm âm lịch để biết hướng cả năm; xem lại vào nửa năm hoặc khi có biến cố lớn để điều chỉnh." },
          { q: "Tuổi nào phạm Thái Tuế năm 2026?", a: "Mỗi năm có một số tuổi xung khắc với Thái Tuế của năm đó. Nhập tuổi và năm vào ô tra cứu phía trên để xem chi tiết theo can chi cụ thể." },
        ]}
      />
    </div>
  );
}
