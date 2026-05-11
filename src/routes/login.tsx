import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — Diễn Cẩm Tam Thế" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Đăng nhập thành công!");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto flex max-w-md items-center px-4 py-16 sm:px-6">
      <Card className="glass-card w-full p-8 shadow-elegant">
        <div className="mb-6 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold">Đăng nhập</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tiếp tục hành trình khám phá vận mệnh</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Mật khẩu</Label>
            <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} size="lg" className="gradient-primary w-full text-primary-foreground shadow-elegant">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đăng nhập…</> : "Đăng nhập"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Chưa có tài khoản? <Link to="/signup" className="font-semibold text-primary hover:underline">Đăng ký</Link>
        </p>
      </Card>
    </div>
  );
}
