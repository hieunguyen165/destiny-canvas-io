import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, KeyRound, LogOut, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginAdmin,
  logoutAdmin,
  setGeminiKey,
  useGeminiKey,
  useIsAdmin,
} from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — Diễn Cẩm Tam Thế" }] }),
  component: AdminPage,
});

function AdminPage() {
  const isAdmin = useIsAdmin();
  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      {isAdmin ? <Settings /> : <Login />}
    </div>
  );
}

function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = loginAdmin(user.trim(), pass);
    setLoading(false);
    if (!ok) return toast.error("Sai tài khoản hoặc mật khẩu");
    toast.success("Đăng nhập quản trị thành công");
  };

  return (
    <Card className="glass-card p-8 shadow-elegant">
      <div className="mb-6 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
          <Shield className="h-5 w-5" />
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Khu Quản Trị</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đăng nhập để cấu hình khoá API riêng, tiết kiệm hạn mức.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="mb-1.5 block text-sm">Tài khoản</Label>
          <Input value={user} onChange={(e) => setUser(e.target.value)} required />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm">Mật khẩu</Label>
          <Input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="gradient-primary w-full text-primary-foreground shadow-elegant"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng nhập…
            </>
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </form>
    </Card>
  );
}

function Settings() {
  const current = useGeminiKey();
  const [val, setVal] = useState(current ?? "");

  const onSave = () => {
    setGeminiKey(val);
    toast.success(val ? "Đã lưu khoá Gemini" : "Đã xoá khoá Gemini");
  };

  const onClear = () => {
    setGeminiKey("");
    setVal("");
    toast.success("Đã xoá khoá Gemini — sẽ dùng hạn mức hệ thống");
  };

  return (
    <Card className="glass-card p-8 shadow-elegant">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Cài đặt riêng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khoá lưu cục bộ trên trình duyệt này, không gửi đi đâu khác ngoài Google Gemini API.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logoutAdmin()}>
          <LogOut className="mr-1.5 h-4 w-4" /> Đăng xuất
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-1.5 flex items-center gap-1.5 text-sm">
            <KeyRound className="h-3.5 w-3.5" /> Khoá API Gemini
          </Label>
          <Input
            type="password"
            placeholder="AIza..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoComplete="off"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Lấy tại{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Google AI Studio
            </a>
            . Khi có khoá, mọi luận giải sẽ gọi thẳng Gemini bằng khoá của bạn.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="gradient-primary flex-1 text-primary-foreground shadow-elegant"
          >
            <Save className="mr-1.5 h-4 w-4" /> Lưu khoá
          </Button>
          <Button variant="outline" onClick={onClear}>
            Xoá
          </Button>
        </div>

        <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          Trạng thái:{" "}
          {current ? (
            <span className="font-semibold text-primary">
              Đang dùng khoá riêng (••••{current.slice(-4)})
            </span>
          ) : (
            <span>Đang dùng hạn mức hệ thống</span>
          )}
        </div>
      </div>
    </Card>
  );
}
