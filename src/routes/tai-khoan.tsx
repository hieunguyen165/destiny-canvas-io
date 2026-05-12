import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCircle, Save, History, Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tai-khoan")({
  head: () => ({ meta: [{ title: "Tài khoản — Hệ Thống Thần Cơ" }] }),
  component: TaiKhoanPage,
});

function TaiKhoanPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-12 text-center">Đang tải…</div>;
  if (!email) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card p-8 text-center shadow-elegant">
          <UserCircle className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-bold">Tài khoản cá nhân</h1>
          <p className="mt-2 text-sm text-muted-foreground">Đăng nhập để quản lý hồ sơ và xem lại lá số đã lập.</p>
          <Button asChild className="gradient-primary mt-5 text-primary-foreground"><Link to="/login">Đăng nhập</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
          <UserCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Tài khoản của tôi</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile"><UserCircle className="mr-1.5 h-4 w-4" />Hồ sơ</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Lá số đã lập</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfilePanel /></TabsContent>
        <TabsContent value="history"><MyHistoryPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProfilePanel() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
      setName(data?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").upsert({ id: u.user.id, display_name: name.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Đã lưu hồ sơ");
  };

  if (loading) return <Card className="glass-card p-6">Đang tải…</Card>;

  return (
    <Card className="glass-card p-6 shadow-elegant">
      <Label className="mb-1.5 block text-sm">Tên hiển thị</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" />
      <Button onClick={onSave} disabled={saving} className="gradient-primary mt-4 text-primary-foreground">
        {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Đang lưu…</> : <><Save className="mr-1.5 h-4 w-4" />Lưu hồ sơ</>}
      </Button>
    </Card>
  );
}

type Hist = { id: string; ho_ten: string; created_at: string; result: any };

function MyHistoryPanel() {
  const [rows, setRows] = useState<Hist[] | null>(null);
  const [view, setView] = useState<Hist | null>(null);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("la_so_history")
      .select("id,ho_ten,created_at,result")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Hist[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Xoá lá số này?")) return;
    const { error } = await supabase.from("la_so_history").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá");
    load();
  };

  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  if (rows.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Bạn chưa lập lá số nào.</p>
        <Button asChild className="gradient-primary mt-4 text-primary-foreground"><Link to="/">Lập lá số</Link></Button>
      </Card>
    );
  }
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <h3 className="mb-3 font-display text-lg font-semibold">Tổng: {rows.length} lá số</h3>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-3">
            <div>
              <div className="font-display font-semibold text-primary">{r.ho_ten}</div>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("vi-VN")}</div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setView(r)}><Eye className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
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
