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
import { doiLich } from "@/lib/tuvi.functions";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lich-am")({
  head: () => ({
    meta: [
      { title: "Lịch Âm — Đổi Dương ↔ Âm — Hệ Thống Thần Cơ" },
      { name: "description", content: "Tra cứu và đổi ngày dương lịch sang âm lịch, xem can chi, tiết khí, hoàng đạo." },
      { property: "og:title", content: "Tra Cứu Lịch Âm" },
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

  const m = useMutation({
    mutationFn: (v: { ngay: number; thang: number; nam: number; chieu: "d2a" | "a2d" }) => fn({ data: v }),
    onSuccess: (d) => { if (d && !d.ok) toast.error(d.error || "AI tạm thời không khả dụng"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra"),
  });

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

        <Button
          onClick={() => m.mutate({ ngay: Number(ngay), thang: Number(thang), nam: Number(nam), chieu })}
          disabled={m.isPending}
          size="lg"
          className="gradient-primary mt-5 w-full text-primary-foreground shadow-elegant"
        >
          {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đổi…</> : "Đổi lịch"}
        </Button>
      </Card>

      {m.data?.ok && m.data.content && (
        <Card className="glass-card mt-8 p-6 sm:p-8 shadow-elegant">
          <Prose content={m.data.ok ? m.data.content : ""} />
        </Card>
      )}
    </div>
  );
}
