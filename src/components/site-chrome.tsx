import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sparkles, LogIn, UserPlus, LogOut, Menu, X, UserCircle, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMyPoints, useAppSettings } from "@/lib/admin";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Trang Chủ" },
  { to: "/tu-vi", label: "Tử Vi" },
  { to: "/van-menh", label: "Vận Mệnh" },
  { to: "/hoang-dao", label: "Hoàng Đạo" },
  { to: "/lich-am", label: "Lịch Âm" },
  { to: "/ngay-tot", label: "Ngày Tốt" },
] as const;

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  
  const points = useMyPoints();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-gradient">Hệ Thống Thần Cơ</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-accent hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {email && points !== null && (
            <Link to="/tai-khoan" className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20">
              <Coins className="h-3.5 w-3.5" /> {points.toLocaleString("vi-VN")} điểm
            </Link>
          )}
          {email ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/tai-khoan"><UserCircle className="mr-1.5 h-4 w-4" />Tài khoản</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> Đăng xuất
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login"><LogIn className="mr-1.5 h-4 w-4" />Đăng nhập</Link>
              </Button>
              <Button size="sm" className="gradient-primary text-primary-foreground shadow-elegant" asChild>
                <Link to="/signup"><UserPlus className="mr-1.5 h-4 w-4" />Đăng ký</Link>
              </Button>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap gap-2 border-t border-border/40 pt-3">
              {email && points !== null && (
                <Link to="/tai-khoan" onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                  <Coins className="h-3.5 w-3.5" /> {points.toLocaleString("vi-VN")} điểm
                </Link>
              )}
              {email ? (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/tai-khoan" onClick={() => setOpen(false)}>Tài khoản</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={onLogout} className="flex-1">
                    <LogOut className="mr-1.5 h-4 w-4" /> Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link>
                  </Button>
                  <Button size="sm" asChild className="gradient-primary flex-1 text-primary-foreground">
                    <Link to="/signup" onClick={() => setOpen(false)}>Đăng ký</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const FOOTER_KEYS = ["footer_about", "footer_note", "footer_copyright", "footer_contact"];

export function SiteFooter() {
  const s = useAppSettings(FOOTER_KEYS);
  const about = s.footer_about || "Tinh hoa tử vi cổ truyền — soi tỏ vận mệnh, đón lành tránh dữ.";
  const note = s.footer_note || "Mọi luận giải mang tính tham khảo dưới góc nhìn văn hoá phương Đông, không thay thế cho quyết định cá nhân.";
  const copyright = s.footer_copyright || `© ${new Date().getFullYear()} Hệ Thống Thần Cơ · Tinh hoa tử vi cổ truyền.`;
  const contact = s.footer_contact;

  return (
    <footer className="mt-20 border-t border-border/40 bg-background/60 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-gradient">Hệ Thống Thần Cơ</span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{about}</p>
          {contact && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{contact}</p>}
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground/70">Khám phá</h4>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="hover:text-primary">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground/70">Lưu ý</h4>
          <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{note}</p>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        {copyright}
      </div>
    </footer>
  );
}
