import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, Loader2, Eye, EyeOff, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Đăng ký — Hệ Thống Thần Cơ" }] }),
  component: SignupPage,
});

function SignupPage() {
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoTen.trim()) return toast.error("Xin nhập họ và tên");
    if (pw.length < 6) return toast.error("Mật khẩu cần ít nhất 6 ký tự");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: hoTen.trim() },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Đăng ký thành công! Bạn được tặng 10 điểm khởi đầu 🎁");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex max-w-md items-center px-4 py-16 sm:px-6">
      <Card className="glass-card w-full p-8 shadow-elegant">
        <div className="mb-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
            <Compass className="h-5 w-5" />
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lưu lịch sử lá số và mở khoá luận giải chuyên sâu</p>
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5 p-3 text-sm">
          <Gift className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <strong className="text-amber-700">Tặng 10 điểm</strong>{" "}
            <span className="text-foreground/80">cho mỗi tài khoản mới — dùng để luận giải.</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Họ và tên</Label>
            <Input required value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Mật khẩu (≥ 6 ký tự)</Label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} size="lg" className="gradient-primary w-full text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tạo…</> : "Đăng ký · Nhận 10 điểm"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Đã có tài khoản? <Link to="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link>
        </p>
      </Card>
    </div>
  );
}
