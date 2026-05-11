import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, KeyRound, Save, Users, History, Settings as SettingsIcon, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { setGeminiKey, useGeminiKey, useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — Diễn Cẩm Tam Thế" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { loading: adminLoading, isAdmin } = useIsAdmin();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!email) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card p-8 text-center shadow-elegant">
          <Shield className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-bold">Khu Quản Trị</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vui lòng đăng nhập bằng tài khoản quản trị.</p>
          <Button asChild className="gradient-primary mt-5 text-primary-foreground"><Link to="/login">Đăng nhập</Link></Button>
        </Card>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card p-8 text-center shadow-elegant">
          <Shield className="mx-auto h-10 w-10 animate-pulse text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Đang xác thực quyền quản trị…</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card p-8 text-center shadow-elegant">
          <Shield className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 font-display text-2xl font-bold">Không có quyền</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản <strong>{email}</strong> không có quyền quản trị.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Khu Quản Trị</h1>
          <p className="text-xs text-muted-foreground">Đang đăng nhập: {email}</p>
        </div>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mb-4">
          <TabsTrigger value="settings"><SettingsIcon className="mr-1.5 h-4 w-4" />Cài đặt</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-1.5 h-4 w-4" />Thành viên</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Lịch sử lá số</TabsTrigger>
        </TabsList>
        <TabsContent value="settings"><SettingsPanel /></TabsContent>
        <TabsContent value="members"><MembersPanel /></TabsContent>
        <TabsContent value="history"><HistoryPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function SettingsPanel() {
  const current = useGeminiKey();
  const [val, setVal] = useState(current ?? "");
  useEffect(() => setVal(current ?? ""), [current]);

  return (
    <Card className="glass-card p-6 shadow-elegant">
      <Label className="mb-1.5 flex items-center gap-1.5 text-sm">
        <KeyRound className="h-3.5 w-3.5" /> Khoá API Gemini (dùng chung cho mọi user)
      </Label>
      <Input type="password" placeholder="AIza..." value={val} onChange={(e) => setVal(e.target.value)} autoComplete="off" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Lấy tại{" "}
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
        Khi admin lưu khoá ở đây, <strong>toàn bộ thành viên</strong> (kể cả khách) sẽ tự động dùng khoá này khi luận giải, giúp tiết kiệm hạn mức hệ thống.
      </p>
      <div className="mt-4 flex gap-2">
        <Button
          onClick={async () => {
            try { await setGeminiKey(val); toast.success(val ? "Đã lưu khoá dùng chung" : "Đã xoá khoá"); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi lưu khoá"); }
          }}
          className="gradient-primary text-primary-foreground"
        >
          <Save className="mr-1.5 h-4 w-4" />Lưu khoá
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try { await setGeminiKey(""); setVal(""); toast.success("Đã xoá khoá"); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi xoá khoá"); }
          }}
        >Xoá</Button>
      </div>
      <div className="mt-4 rounded-md border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
        Trạng thái: {current ? <span className="font-semibold text-primary">Đang dùng khoá chung (••••{current.slice(-4)}) — áp dụng cho tất cả thành viên</span> : "Đang dùng hạn mức hệ thống"}
      </div>
    </Card>
  );
}

type Member = { id: string; display_name: string | null; created_at: string };

function MembersPanel() {
  const [rows, setRows] = useState<Member[] | null>(null);
  useEffect(() => {
    supabase.from("profiles").select("id,display_name,created_at").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (error) toast.error(error.message);
      setRows(data ?? []);
    });
  }, []);
  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <h3 className="mb-3 font-display text-lg font-semibold">Tổng thành viên: {rows.length}</h3>
      <div className="overflow-hidden rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Tên hiển thị</th>
            <th className="px-3 py-2 text-left">User ID</th>
            <th className="px-3 py-2 text-left">Ngày tham gia</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 font-medium">{r.display_name || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Chưa có thành viên nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type Hist = { id: string; user_id: string; ho_ten: string; created_at: string; result: any };

function HistoryPanel() {
  const [rows, setRows] = useState<Hist[] | null>(null);
  const [view, setView] = useState<Hist | null>(null);

  const load = () => {
    supabase.from("la_so_history").select("id,user_id,ho_ten,created_at,result").order("created_at", { ascending: false }).limit(200).then(({ data, error }) => {
      if (error) toast.error(error.message);
      setRows(data as Hist[] ?? []);
    });
  };
  useEffect(load, []);

  const onDelete = async (id: string) => {
    if (!confirm("Xoá lá số này?")) return;
    const { error } = await supabase.from("la_so_history").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá");
    load();
  };

  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <h3 className="mb-3 font-display text-lg font-semibold">Tổng lá số: {rows.length}</h3>
      <div className="overflow-hidden rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Họ tên</th>
            <th className="px-3 py-2 text-left">Thành viên</th>
            <th className="px-3 py-2 text-left">Thời gian</th>
            <th className="px-3 py-2 text-right">Thao tác</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 font-medium">{r.ho_ten}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.user_id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setView(r)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Chưa có lá số nào.</td></tr>}
          </tbody>
        </table>
      </div>
      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setView(null)}>
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold">{view.ho_ten}</h4>
              <Button size="sm" variant="ghost" onClick={() => setView(null)}>Đóng</Button>
            </div>
            <pre className="overflow-auto rounded bg-muted/40 p-3 text-xs">{JSON.stringify(view.result, null, 2)}</pre>
          </Card>
        </div>
      )}
    </Card>
  );
}
