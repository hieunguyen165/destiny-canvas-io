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
import { vanMenh } from "@/lib/tuvi.functions";
import { useGeminiKey } from "@/lib/admin";

export const Route = createFileRoute("/van-menh")({
  head: () => ({
    meta: [
      { title: "Vận Mệnh Năm — Hệ Thống Thần Cơ" },
      { name: "description", content: "Xem vận mệnh tổng quan theo năm cho 12 con giáp: tài lộc, công việc, tình duyên, sức khoẻ." },
      { property: "og:title", content: "Vận Mệnh Theo Tuổi" },
      { property: "og:description", content: "Tử vi vận mệnh năm cho 12 con giáp Việt Nam." },
    ],
  }),
  component: VanMenhPage,
});

const GIAP = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const ICONS: Record<string, string> = { Tý: "🐭", Sửu: "🐮", Dần: "🐯", Mão: "🐱", Thìn: "🐲", Tỵ: "🐍", Ngọ: "🐴", Mùi: "🐐", Thân: "🐵", Dậu: "🐔", Tuất: "🐶", Hợi: "🐷" };

function VanMenhPage() {
  const fn = useServerFn(vanMenh);
  const geminiKey = useGeminiKey();
  const [tuoi, setTuoi] = useState("Tý");
  const year = new Date().getFullYear();
  const [nam, setNam] = useState(String(year));

  const m = useMutation({
    mutationFn: (v: { conGiap: string; nam: number }) => fn({ data: { ...v, geminiKey } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra"),
  });

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
          <Button
            onClick={() => m.mutate({ conGiap: tuoi, nam: Number(nam) })}
            disabled={m.isPending}
            size="lg"
            className="gradient-primary text-primary-foreground shadow-elegant"
          >
            {m.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang xem…</> : <>Xem vận mệnh tuổi {tuoi}</>}
          </Button>
        </div>
      </Card>

      {m.data?.content && (
        <Card className="glass-card mt-8 p-6 sm:p-10 shadow-elegant">
          <div className="mb-3 text-sm text-muted-foreground">
            Vận mệnh năm <strong className="text-foreground">{nam}</strong> cho người tuổi <strong className="text-foreground">{tuoi}</strong>
          </div>
          <Prose content={m.data.content} />
        </Card>
      )}
    </div>
  );
}
