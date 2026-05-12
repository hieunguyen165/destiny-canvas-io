import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Compass, Calendar, Star, Heart, Phone, Hash, CalendarDays, ArrowRight, Shield, Scroll, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hệ Thống Thần Cơ — Khám Phá Vận Mệnh Bằng AI & Tử Vi Cổ Truyền" },
      { name: "description", content: "Hệ Thống Thần Cơ kết hợp tinh hoa Tử Vi Đẩu Số và trí tuệ nhân tạo hiện đại — lập lá số, luận vận mệnh, xem ngày tốt, lịch âm và nhiều hơn nữa." },
      { property: "og:title", content: "Hệ Thống Thần Cơ — Trí Tuệ Cổ Xưa & AI" },
      { property: "og:description", content: "Khám phá vận mệnh, đón lành tránh dữ với hệ thống luận giải kết hợp tử vi cổ truyền và AI." },
    ],
  }),
  component: HomePage,
});

const TOOLS = [
  { to: "/tu-vi", label: "Tử Vi Đẩu Số", desc: "Lập lá số 12 cung, luận giải 14 mục vận mệnh", icon: Compass, color: "from-rose-500/20 to-pink-500/10" },
  { to: "/van-menh", label: "Luận Vận Mệnh", desc: "AI phân tích vận hạn, sự nghiệp, tình duyên", icon: Sparkles, color: "from-purple-500/20 to-indigo-500/10" },
  { to: "/hoang-dao", label: "Cung Hoàng Đạo", desc: "Tử vi tuần — 12 cung phương Tây", icon: Star, color: "from-amber-500/20 to-yellow-500/10" },
  { to: "/lich-am", label: "Lịch Âm", desc: "Đổi lịch âm — dương, can chi, tiết khí", icon: Calendar, color: "from-emerald-500/20 to-teal-500/10" },
  { to: "/ngay-tot", label: "Xem Ngày Tốt", desc: "Tìm ngày hoàng đạo cho việc đại sự", icon: CalendarDays, color: "from-cyan-500/20 to-sky-500/10" },
  { to: "/tu-vi", label: "Hợp Tuổi", desc: "Xem tuổi vợ chồng, đối tác, bạn bè", icon: Heart, color: "from-red-500/20 to-rose-500/10" },
  { to: "/tu-vi", label: "Thần Số Học", desc: "Giải mã con số định mệnh", icon: Hash, color: "from-blue-500/20 to-indigo-500/10" },
  { to: "/tu-vi", label: "Số ĐT Phong Thủy", desc: "Luận sim hợp mệnh, bốc tài lộc", icon: Phone, color: "from-fuchsia-500/20 to-pink-500/10" },
] as const;

const FEATURES = [
  { icon: BookOpen, title: "Tinh Hoa Cổ Truyền", desc: "Kế thừa thuật toán Tử Vi Đẩu Số và phương pháp Diễn Cẩm Tam Thế hàng nghìn năm." },
  { icon: Scroll, title: "Luận Giải Chuyên Sâu", desc: "Hệ thống đọc hiểu can chi, sao chiếu, đại tiểu hạn — luận giải chi tiết theo từng cung." },
  { icon: Shield, title: "Riêng Tư & An Toàn", desc: "Thông tin của bạn được mã hoá và bảo mật tuyệt đối, không chia sẻ cho bên thứ ba." },
];

function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] bg-gradient-to-b from-transparent via-background/50 to-background" />
        {/* Floating orbs */}
        <div className="pointer-events-none absolute -left-20 top-40 -z-10 h-72 w-72 animate-[pulse_6s_ease-in-out_infinite] rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-20 -z-10 h-96 w-96 animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-accent/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
          <div className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Tinh hoa tử vi cổ truyền Việt Nam
          </div>
          <h1 className="mt-6 animate-fade-in font-display text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Khám Phá <span className="text-gradient">Vận Mệnh</span>
            <br />Của Bạn
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-fade-in text-base text-muted-foreground sm:text-lg">
            Hệ thống <strong>Tử Vi Đẩu Số</strong> theo phương pháp <strong>Diễn Cẩm Tam Thế</strong> cổ truyền,
            giúp bạn thấu hiểu bản thân, đón lành tránh dữ và làm chủ tương lai.
          </p>
          <div className="mt-8 flex animate-fade-in flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant hover-scale">
              <Link to="/tu-vi"><Compass className="mr-2 h-5 w-5" />Xem Tử Vi Ngay</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover-scale">
              <Link to="/van-menh"><Sparkles className="mr-2 h-5 w-5" />Luận Vận Mệnh</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#tools">Khám phá thêm <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-3 gap-3 text-center sm:gap-6">
            <Stat k="14+" v="Mục vận mệnh" />
            <Stat k="12" v="Cung tử vi" />
            <Stat k="AI" v="Luận giải sâu" />
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Bộ Công Cụ <span className="text-gradient">Thần Cơ</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tất cả công cụ luận đoán cổ truyền và hiện đại trong một nền tảng duy nhất.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <Link
              key={i}
              to={t.to}
              className="group animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card className={`glass-card relative h-full overflow-hidden border-border/60 p-5 transition-all hover:-translate-y-1 hover:shadow-elegant`}>
                <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${t.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Khám phá <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Card key={i} className="glass-card border-border/60 p-6 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <Card className="glass-card relative overflow-hidden border-primary/30 p-10 text-center shadow-elegant">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
          <Sparkles className="mx-auto h-10 w-10 animate-pulse text-primary" />
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Sẵn sàng <span className="text-gradient">khải lộ thiên cơ</span>?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Lập lá số tử vi miễn phí ngay hôm nay. Đăng ký tài khoản để mở khoá luận chi tiết với điểm thành viên.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant">
              <Link to="/tu-vi">Lập Lá Số Ngay</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/signup">Tạo Tài Khoản</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-3 backdrop-blur">
      <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">{k}</div>
      <div className="text-xs text-muted-foreground sm:text-sm">{v}</div>
    </div>
  );
}
