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
import { ngayTot } from "@/lib/tuvi.functions";


export const Route = createFileRoute("/ngay-tot")({
  head: () => ({
    meta: [
      { title: "Xem Ngày Tốt — Hệ Thống Thần Cơ" },
      { name: "description", content: "Tra cứu ngày tốt cho cưới hỏi, khai trương, động thổ, xuất hành theo can chi." },
      { property: "og:title", content: "Xem Ngày Tốt" },
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

  const m = useMutation({
    mutationFn: (v: { loaiViec: string; thang: number; nam: number }) => fn({ data: v }),
    onSuccess: (d) => { if (d && !d.ok) toast.error(d.error || "AI tạm thời không khả dụng"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra"),
  });

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
          <div className="sm:col-span-3">
            <Button
              onClick={() => m.mutate({ loaiViec, thang: Number(thang), nam: Number(nam) })}
              disabled={m.isPending}
              size="lg"
              className="gradient-primary w-full text-primary-foreground shadow-elegant"
            >
              {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tra cứu…</> : "Tra ngày tốt"}
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
    </div>
  );
}
