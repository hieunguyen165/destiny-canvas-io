import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, Calendar, Sun, Moon, Lock, CheckCircle2, Loader2, Compass } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { lapLaSo, type KetQuaLaSo } from "@/lib/tuvi.functions";
import { LaSoChart } from "@/components/la-so-chart";
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
  { icon: "🗺️", label: "Bản đồ Lá Số 12 Cung" },
  { icon: "📜", label: "Coi Số Sanh Tổng Luận" },
  { icon: "🎯", label: "Số Cầu (12 Cầu)" },
  { icon: "🌸", label: "Đại Hạn — Tiểu Hạn" },
];
const LOCKED = [
  "Coi làm ăn nghề nghiệp gì thuận số",
  "Thiên Can Hiệp Tháng Sanh — Tìm Nghề",
  "Ngày Sang Hèn",
  "Coi Số Có Nhà Hay Không",
  "Số Kiếp Vợ Chồng",
];

const LOAD_PHRASES = [
  "Đang kết nối hệ thống thần cơ…",
  "Hé mở càn khôn, truy xuất tàng thư…",
  "Từ cõi mịch mờ, vạn tượng dần hiện rõ…",
  "Sao trời chuyển động, can chi giao hội…",
  "Tam Thế ứng nghiệm, lá số đã hiện hình…",
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
          <Compass className="h-3 w-3" /> Tinh hoa tử vi cổ truyền
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Lập <span className="text-gradient">Lá Số Tử Vi</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Nhập thông tin của bạn để hệ thống luận giải <strong>14 mục vận mệnh</strong> theo phương pháp Diễn Cẩm Tam Thế.
        </p>
      </section>

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
                <><Compass className="mr-2 h-4 w-4" /> Lập Lá Số Tử Vi</>
              )}
            </Button>
          </form>
        </Card>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
        {!m.data && !m.isPending && <EmptyState />}
        {m.isPending && <MysticLoading />}
        {m.data?.data && <KetQuaBoxes kq={m.data.data} />}
      </section>

      <div className="h-20" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="glass-card mx-auto max-w-3xl border-dashed border-border/60 p-8 text-center">
      <h3 className="font-display text-2xl font-semibold">Nhập thông tin để nhận lá số</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Hệ thống sẽ phân tích <span className="text-gradient-gold font-semibold">14 mục vận mệnh</span> theo
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
  );
}

function MysticLoading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % LOAD_PHRASES.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <Card className="glass-card mx-auto max-w-2xl overflow-hidden p-10 text-center">
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-primary/40" />
        <div className="absolute inset-2 animate-[spin_5s_linear_infinite_reverse] rounded-full border border-dotted border-accent/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Compass className="h-9 w-9 animate-pulse text-primary" />
        </div>
      </div>
      <p className="mt-6 font-display text-lg text-primary sm:text-xl">{LOAD_PHRASES[i]}</p>
      <div className="mx-auto mt-4 flex max-w-xs justify-center gap-1.5">
        {LOAD_PHRASES.map((_, k) => (
          <div
            key={k}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              k <= i ? "bg-gradient-to-r from-primary to-accent" : "bg-border/60",
            )}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Xin chớ nóng lòng, thiên cơ đang dần khải lộ…</p>
    </Card>
  );
}

function SectionBox({
  index,
  title,
  subtitle,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card border-border/60 p-5 shadow-soft sm:p-6">
      <div className="mb-3 flex items-baseline gap-3 border-b border-dashed border-border pb-3">
        <span className="font-display text-2xl text-accent">{String(index).padStart(2, "0")}</span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-primary sm:text-xl">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </Card>
  );
}

function KetQuaBoxes({ kq }: { kq: KetQuaLaSo }) {
  const t = kq.thongTinCoBan;
  return (
    <div className="space-y-5">
      <SectionBox index={1} title="Bản Đồ Lá Số" subtitle="Thiên bàn 12 cung — phương pháp Diễn Cẩm Tam Thế">
        <LaSoChart kq={kq} />
      </SectionBox>

      <SectionBox index={2} title="Xác Nhận Thông Tin Cơ Bản">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          <Info k="Họ tên" v={t.hoTen} />
          <Info k="Giới tính" v={t.gioiTinh} />
          <Info k="Giờ sinh" v={t.gioSinh} />
          <Info k="Ngày dương" v={t.ngayDuong} />
          <Info k="Ngày âm" v={t.ngayAm} />
          <Info k="Bản mệnh" v={t.banMenh} />
          <Info k="Can chi năm" v={t.canChiNam} />
          <Info k="Can chi tháng" v={t.canChiThang} />
          <Info k="Can chi ngày" v={t.canChiNgay} />
          <Info k="Can chi giờ" v={t.canChiGio} />
          <Info k="Cung Mệnh" v={t.cungMenh} />
          <Info k="Cung Thân" v={t.cungThan} />
          <Info k="Sao chủ Mệnh" v={t.saoChuMenh} />
          <Info k="Sao chủ Thân" v={t.saoChuThan} />
        </dl>
      </SectionBox>

      <SectionBox index={3} title="Luận Giải 12 Cung">
        <div className="grid gap-3 sm:grid-cols-2">
          {kq.luanGiai12Cung.map((c, i) => (
            <div key={i} className="rounded-md border border-border/60 bg-background/40 p-3">
              <div className="flex items-center justify-between">
                <div className="font-display text-sm font-semibold text-primary">{c.ten}</div>
                <div className="text-[11px] text-amber-700">{c.saoChinh}</div>
              </div>
              <p className="mt-1.5 text-sm text-foreground/80">{c.luanGiai}</p>
            </div>
          ))}
        </div>
      </SectionBox>

      <SectionBox index={4} title="Đại Hạn — Tiểu Hạn (Hiện Tại)">
        <p className="whitespace-pre-line">{kq.daiTieuHan}</p>
      </SectionBox>

      <SectionBox index={5} title="Toàn Bộ Đại Hạn">
        <div className="overflow-hidden rounded-md border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-accent/40 font-display">
              <tr>
                <th className="px-3 py-2 text-left">Giai đoạn</th>
                <th className="px-3 py-2 text-left">Cung</th>
                <th className="px-3 py-2 text-left">Luận giải</th>
              </tr>
            </thead>
            <tbody>
              {kq.toanBoDaiHan.map((d, i) => (
                <tr key={i} className="border-t border-border/60 odd:bg-background/40">
                  <td className="px-3 py-2 font-semibold">{d.giaiDoan}</td>
                  <td className="px-3 py-2 text-primary">{d.cung}</td>
                  <td className="px-3 py-2 text-foreground/80">{d.luanGiai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBox>

      <SectionBox index={6} title="Tiểu Hạn Theo Năm">
        <div className="space-y-2">
          {kq.tieuHanTheoNam.map((n, i) => (
            <div key={i} className="rounded-md border border-border/60 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-base text-primary">Năm {n.nam}</span>
                <span className="rounded-full bg-accent/40 px-2 py-0.5 text-[11px]">{n.canChi}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/80">{n.luanGiai}</p>
            </div>
          ))}
        </div>
      </SectionBox>

      <SectionBox index={7} title="Diễn Cầm Tam Thế" subtitle="Tiền vận — Trung vận — Hậu vận">
        <p className="whitespace-pre-line">{kq.dienCamTamThe}</p>
      </SectionBox>

      <SectionBox index={8} title="Coi Số Sanh Tổng Luận">
        <p className="whitespace-pre-line">{kq.soSanhTongLuan}</p>
      </SectionBox>

      <SectionBox index={9} title="Số Cầu (12 Cầu)">
        <div className="grid gap-2 sm:grid-cols-2">
          {kq.soCau.map((s, i) => {
            const tone =
              s.danhGia.toLowerCase().includes("kiết") || s.danhGia.toLowerCase().includes("kiet")
                ? "bg-emerald-500/10 text-emerald-700"
                : s.danhGia.toLowerCase().includes("hung")
                  ? "bg-rose-500/10 text-rose-700"
                  : "bg-amber-500/10 text-amber-700";
            return (
              <div key={i} className="flex items-start gap-2 rounded-md border border-border/60 bg-background/40 p-2.5">
                <span className="mt-0.5 inline-flex h-7 w-12 items-center justify-center rounded-full font-display text-xs font-semibold uppercase tracking-wider text-primary">
                  {s.ten}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>
                  {s.danhGia}
                </span>
                <span className="flex-1 text-sm text-foreground/80">{s.luanGiai}</span>
              </div>
            );
          })}
        </div>
      </SectionBox>

      <SectionBox index={10} title="Coi Làm Ăn — Nghề Nghiệp Gì Thuận Số">
        <p className="whitespace-pre-line">{kq.ngheNghiepThuanSo}</p>
      </SectionBox>

      <SectionBox index={11} title="Thiên Can Hiệp Tháng Sanh — Tìm Nghề Nghiệp">
        <p className="whitespace-pre-line">{kq.thienCanHiepThangSanh}</p>
      </SectionBox>

      <SectionBox index={12} title="Ngày Sang Hèn">
        <p className="whitespace-pre-line">{kq.ngaySangHen}</p>
      </SectionBox>

      <SectionBox index={13} title="Coi Số Có Nhà Hay Không">
        <p className="whitespace-pre-line">{kq.soCoNha}</p>
      </SectionBox>

      <SectionBox index={14} title="Số Kiếp Vợ Chồng">
        <p className="whitespace-pre-line">{kq.soKiepVoChong}</p>
      </SectionBox>

      <p className="text-center text-xs italic text-muted-foreground">
        ⚠ Mọi luận giải mang tính tham khảo dưới góc nhìn văn hoá phương Đông, không khẳng định tuyệt đối.
      </p>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground">{v}</dd>
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
