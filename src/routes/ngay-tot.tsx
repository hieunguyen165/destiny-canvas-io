import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CalendarHeart } from "lucide-react";
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
import { ngayTot } from "@/lib/tuvi.functions";


export const Route = createFileRoute("/ngay-tot")({
  head: () => ({
    meta: [
      { title: "Xem Ngày Tốt — Cưới Hỏi, Khai Trương, Động Thổ, Xuất Hành | Thần Cơ" },
      { name: "description", content: "Tra cứu ngày hoàng đạo, ngày tốt cho cưới hỏi, khai trương, động thổ, nhập trạch, xuất hành theo lịch can chi Việt Nam." },
      { property: "og:title", content: "Xem Ngày Tốt Hoàng Đạo" },
      { property: "og:description", content: "Chọn việc làm và tháng để xem ngày hoàng đạo phù hợp." },
    ],
  }),
  component: NgayTotPage,
});

const VIEC = [
  "Cưới hỏi", "Khai trương", "Động thổ", "Nhập trạch", "Xuất hành",
  "Ký kết hợp đồng", "Mua xe", "An sàng", "Cầu tài lộc",
];

function NgayTotPage() {
  const fn = useServerFn(ngayTot);
  const today = new Date();
  const [loaiViec, setLoaiViec] = useState(VIEC[0]);
  const [thang, setThang] = useState(String(today.getMonth() + 1));
  const [nam, setNam] = useState(String(today.getFullYear()));
  const points = useMyPoints();
  const costs = useCosts();
  const cost = costs.ngay_tot ?? 0;
  const costLabel = useCostLabel("ngay_tot");

  const m = useMutation({
    mutationFn: (v: { loaiViec: string; thang: number; nam: number }) => fn({ data: v }),
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
    if (cost > 0 && points === null) { toast.error(`Vui lòng đăng nhập để tra cứu (${costLabel}/lần).`); return; }
    if (cost > 0 && points !== null && points < cost) { toast.error(`Không đủ điểm! Cần ${costLabel}.`); return; }
    m.mutate({ loaiViec, thang: Number(thang), nam: Number(nam) });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <CalendarHeart className="h-3 w-3" /> Hoàng Đạo Cát Nhật
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">
          Xem <span className="text-gradient">Ngày Tốt</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn việc cần làm và tháng cần xem.</p>
      </div>

      <Card className="glass-card mt-8 p-6 sm:p-8 shadow-elegant">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Label className="mb-1.5 block text-sm">Việc cần xem</Label>
            <Select value={loaiViec} onValueChange={setLoaiViec}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VIEC.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Tháng</Label>
            <Select value={thang} onValueChange={setThang}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map((t) => <SelectItem key={t} value={String(t)}>Tháng {t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Năm</Label>
            <Select value={nam} onValueChange={setNam}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Array.from({ length: 5 }, (_, i) => today.getFullYear() + i).map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-3 flex flex-col items-stretch gap-2">
            <div className="flex justify-end"><CostBadge costKey="ngay_tot" /></div>
            <Button
              onClick={handleClick}
              disabled={m.isPending}
              size="lg"
              className="gradient-primary w-full text-primary-foreground shadow-elegant"
            >
              {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tra cứu…</> : `Tra ngày tốt · ${costLabel}`}
            </Button>
          </div>
        </div>
      </Card>

      {m.data?.ok && m.data.content && (
        <Card className="glass-card mt-8 p-6 sm:p-10 shadow-elegant">
          <div className="mb-3 text-sm text-muted-foreground">
            Ngày tốt cho việc <strong className="text-foreground">{loaiViec}</strong> trong tháng <strong className="text-foreground">{thang}/{nam}</strong>
          </div>
          <Prose content={m.data.ok ? m.data.content : ""} />
        </Card>
      )}

      <SeoSection
        title="Cách xem ngày tốt theo lịch can chi Việt Nam"
        intro="Xem ngày tốt — hay 'chọn ngày hoàng đạo' — là phong tục lâu đời của người Việt khi tiến hành các việc trọng đại như cưới hỏi, khai trương, động thổ, nhập trạch, xuất hành. Mỗi ngày trong lịch can chi có thuộc tính cát hung khác nhau dựa trên Trực, Sao, Nhị Thập Bát Tú và sự xung khắc với tuổi gia chủ."
        blocks={[
          { heading: "Ngày tốt cưới hỏi", body: "Nên chọn ngày hoàng đạo, không phạm tuổi cô dâu chú rể, tránh tháng cô hồn (tháng 7 âm), tránh ngày Tam Nương (3, 7, 13, 18, 22, 27 âm). Ưu tiên ngày có sao Thiên Đức, Nguyệt Đức, Thiên Hỷ chiếu." },
          { heading: "Ngày tốt khai trương, mở hàng", body: "Chọn ngày Trực Thành, Trực Khai, Trực Mãn; có sao Đại An, Lộc Mã chiếu. Tránh ngày Sát Chủ, Thụ Tử, Trùng Tang. Giờ hoàng đạo trong ngày cũng quan trọng không kém ngày." },
          { heading: "Ngày tốt động thổ, nhập trạch", body: "Cần xem cả ngày, giờ và hướng. Tránh năm hạn Kim Lâu, Hoang Ốc, Tam Tai của tuổi gia chủ. Ngày Bất Tương được ưu tiên cho động thổ và xây dựng." },
          { heading: "Ngày xuất hành, đi xa, ký hợp đồng", body: "Xem giờ hoàng đạo trong ngày là đủ cho việc nhỏ; với hợp đồng lớn cần kết hợp ngày tốt với hướng xuất hành theo Khổng Minh Lục Diệu." },
        ]}
        faqs={[
          { q: "Ngày hoàng đạo là ngày gì?", a: "Là ngày có sao tốt chiếu mệnh, theo Lịch Vạn Niên Việt Nam có 12 trực, 28 sao — ngày được nhiều cát tinh và ít hung tinh là ngày hoàng đạo." },
          { q: "Tại sao cùng một ngày, người này tốt người kia xấu?", a: "Vì còn xét tuổi (can chi sinh) của từng người. Ngày đẹp với người tuổi này có thể xung khắc với người tuổi khác." },
          { q: "Có cần coi giờ hoàng đạo không?", a: "Nên. Sau khi chọn được ngày tốt, bạn nên chọn giờ hoàng đạo trong ngày đó để tiến hành công việc — sẽ tăng phần cát lợi." },
        ]}
      />
    </div>
  );
}
