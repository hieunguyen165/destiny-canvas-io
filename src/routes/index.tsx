import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, User, Calendar, Sun, Moon, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Prose } from "@/components/prose";
import { lapLaSo } from "@/lib/tuvi.functions";
import heroBg from "@/assets/hero-bg.jpg";
import vase from "@/assets/peach-vase.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lập Lá Số Tử Vi — Diễn Cẩm Tam Thế" },
      { name: "description", content: "Lập lá số tử vi miễn phí, luận giải vận mệnh theo phương pháp Diễn Cẩm Tam Thế cổ truyền." },
      { property: "og:title", content: "Lập Lá Số Tử Vi" },
      { property: "og:description", content: "Khám phá vận mệnh qua lá số tử vi cổ truyền Việt Nam." },
    ],
  }),
  component: TuViPage,
});

const GIO = [
  "Giờ Tý (23:00 - 01:00)", "Giờ Sửu (01:00 - 03:00)", "Giờ Dần (03:00 - 05:00)",
  "Giờ Mão (05:00 - 07:00)", "Giờ Thìn (07:00 - 09:00)", "Giờ Tỵ (09:00 - 11:00)",
  "Giờ Ngọ (11:00 - 13:00)", "Giờ Mùi (13:00 - 15:00)", "Giờ Thân (15:00 - 17:00)",
  "Giờ Dậu (17:00 - 19:00)", "Giờ Tuất (19:00 - 21:00)", "Giờ Hợi (21:00 - 23:00)",
];

const FREE_FEATURES = [
  { icon: "👶", label: "Coi con nít mới sanh mạng gì" },
  { icon: "📜", label: "Coi Số Sanh Tổng Luận" },
  { icon: "🎯", label: "Số Cầu (12 Cầu)" },
];
const LOCKED = [
  "Coi làm ăn nghề nghiệp gì thuận số",
  "Ngày Sang Hèn",
  "Coi ruộng đất có không",
  "Thiên Can Hiệp Tháng Sanh — Tìm Nghề",
  "Coi học giỏi, dở",
  "Coi thi cử lấy khoa đặng không",
  "Coi hào anh em kiết hung",
  "Coi tuổi con trai có phá sản vợ không",
];

function TuViPage() {
  const lapLaSoFn = useServerFn(lapLaSo);
  const [hoTen, setHoTen] = useState("");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [loaiLich, setLoaiLich] = useState<"duong" | "am">("duong");
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [gio, setGio] = useState("0");

  type Vars = { hoTen: string; gioiTinh: "nam" | "nu"; loaiLich: "duong" | "am"; ngay: number; thang: number; nam: number; gio: number };
  const m = useMutation({
    mutationFn: (vars: Vars) => lapLaSoFn({ data: vars }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Có lỗi xảy ra, mời thử lại."),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) return toast.error("Xin nhập họ và tên");
    const d = Number(ngay), t = Number(thang), y = Number(nam);
    if (!d || !t || !y) return toast.error("Xin nhập đầy đủ ngày, tháng, năm sinh");
    if (y < 1900 || y > 2100) return toast.error("Năm sinh không hợp lệ");
    m.mutate({ hoTen: hoTen.trim(), gioiTinh, loaiLich, ngay: d, thang: t, nam: y, gio: Number(gio) });
  };

  return (
    <div className="relative">
      {/* Hero */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-gradient-to-b from-transparent via-background/40 to-background" />

      <img
        src={vase}
        alt=""
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 -z-10 hidden w-[280px] opacity-70 lg:block"
        loading="lazy"
      />

      <section className="mx-auto max-w-3xl px-4 pt-12 pb-6 text-center sm:px-6 sm:pt-20">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3 w-3" /> Tinh hoa tử vi cổ truyền
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Lập <span className="text-gradient">Lá Số Tử Vi</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Nhập thông tin của bạn để hệ thống luận giải 28 mục vận mệnh
          theo phương pháp Diễn Cẩm Tam Thế.
        </p>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <Card className="glass-card border-border/60 shadow-elegant p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <Field icon={<User className="h-4 w-4" />} label="Họ và tên">
              <Input value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nhập tên của bạn" />
            </Field>

            <Field icon={<User className="h-4 w-4" />} label="Giới tính">
              <div className="grid grid-cols-2 gap-3">
                <Choice active={gioiTinh === "nam"} onClick={() => setGioiTinh("nam")}>♂ Nam</Choice>
                <Choice active={gioiTinh === "nu"} onClick={() => setGioiTinh("nu")}>♀ Nữ</Choice>
              </div>
            </Field>

            <Field icon={<Calendar className="h-4 w-4" />} label="Loại lịch">
              <div className="grid grid-cols-2 gap-3">
                <Choice active={loaiLich === "duong"} onClick={() => setLoaiLich("duong")}>
                  <Sun className="mr-1.5 inline h-4 w-4" /> Dương lịch
                </Choice>
                <Choice active={loaiLich === "am"} onClick={() => setLoaiLich("am")}>
                  <Moon className="mr-1.5 inline h-4 w-4" /> Âm lịch
                </Choice>
              </div>
            </Field>

            <Field icon={<Calendar className="h-4 w-4" />} label="Ngày / Tháng / Năm sinh & Giờ sinh"
              hint="Chọn loại lịch ở trên, rồi nhập theo đúng lịch đó. Lá số sẽ luận giải theo can chi.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Input placeholder="Ngày" inputMode="numeric" value={ngay} onChange={(e) => setNgay(e.target.value)} />
                <Input placeholder="Tháng" inputMode="numeric" value={thang} onChange={(e) => setThang(e.target.value)} />
                <Input placeholder="Năm" inputMode="numeric" value={nam} onChange={(e) => setNam(e.target.value)} />
                <Select value={gio} onValueChange={setGio}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GIO.map((g, i) => <SelectItem key={i} value={String(i)}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={m.isPending}
              size="lg"
              className="gradient-primary w-full text-primary-foreground shadow-elegant hover:opacity-95"
            >
              {m.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang luận giải…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Lập Lá Số Tử Vi</>
              )}
            </Button>
          </form>
        </Card>
      </section>

      {/* Result */}
      <section className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        {!m.data && !m.isPending && (
          <Card className="glass-card border-dashed border-border/60 p-8 text-center">
            <h3 className="font-display text-2xl font-semibold">Nhập thông tin để nhận kết quả luận giải</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Hệ thống sẽ phân tích <span className="text-gradient-gold font-semibold">28 mục vận mệnh</span> theo
              phương pháp Diễn Cẩm Tam Thế cổ truyền.
            </p>

            <div className="mt-6 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              MIỄN PHÍ
            </div>
            <ul className="mx-auto mt-3 grid max-w-md gap-2 text-left text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 rounded-md bg-background/40 px-3 py-2">
                  <span className="text-lg">{f.icon}</span>
                  <span className="flex-1">{f.label}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </li>
              ))}
            </ul>

            <div className="mt-8 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              LUẬN GIẢI CHUYÊN SÂU
            </div>
            <ul className="mx-auto mt-3 grid max-w-md gap-2 text-left text-sm">
              {LOCKED.map((l) => (
                <li key={l} className="flex items-center gap-2 rounded-md bg-background/40 px-3 py-2 opacity-70">
                  <span className="text-lg">🔒</span>
                  <span className="flex-1">{l}</span>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Card>
        )}

        {m.isPending && (
          <Card className="glass-card p-10 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 font-display text-lg">Đang chiêm nghiệm lá số…</p>
            <p className="mt-1 text-sm text-muted-foreground">Vui lòng đợi trong giây lát</p>
          </Card>
        )}

        {m.data?.content && (
          <Card className="glass-card border-border/60 p-6 shadow-elegant sm:p-10">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Luận giải lá số cho <span className="font-semibold text-foreground">{hoTen}</span>
            </div>
            <Prose content={m.data.content} />
          </Card>
        )}
      </section>

      <div className="h-20" />
    </div>
  );
}

function Field({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground/80">
        <span className="text-primary">{icon}</span>{label}
      </Label>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm font-semibold transition-all",
        active
          ? "border-primary/40 bg-primary/10 text-primary shadow-soft"
          : "border-border bg-background/60 text-foreground/70 hover:border-primary/30",
      )}
    >
      {children}
    </button>
  );
}
