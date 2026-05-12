import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, KeyRound, Save, Users, History, Settings as SettingsIcon, Trash2, Eye, LayoutDashboard, Coins, Plus, UserCircle, FileText, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { setGeminiKey, useGeminiKey, useIsAdmin, useAppSettings, setAppSetting } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — Hệ Thống Thần Cơ" }] }),
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
          <p className="mt-2 text-sm text-muted-foreground">Tài khoản <strong>{email}</strong> không có quyền quản trị.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Khu Quản Trị</h1>
          <p className="text-xs text-muted-foreground">Đang đăng nhập: {email}</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Tổng quan</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-1.5 h-4 w-4" />Thành viên</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Lịch sử lá số</TabsTrigger>
          <TabsTrigger value="info"><Info className="mr-1.5 h-4 w-4" />Thông tin</TabsTrigger>
          <TabsTrigger value="settings"><SettingsIcon className="mr-1.5 h-4 w-4" />Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="members"><MembersPanel /></TabsContent>
        <TabsContent value="history"><HistoryPanel /></TabsContent>
        <TabsContent value="info"><InfoPanel /></TabsContent>
        <TabsContent value="settings"><SettingsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard() {
  const [stats, setStats] = useState<{ members: number; charts: number; guestCharts: number; pointsIssued: number; pointsSpent: number } | null>(null);
  useEffect(() => {
    (async () => {
      const [m, c, g, txs] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("la_so_history").select("*", { count: "exact", head: true }),
        supabase.from("la_so_history").select("*", { count: "exact", head: true }).is("user_id", null),
        supabase.from("points_transactions").select("amount"),
      ]);
      let issued = 0, spent = 0;
      (txs.data as { amount: number }[] | null)?.forEach((t) => { if (t.amount > 0) issued += t.amount; else spent += -t.amount; });
      setStats({
        members: m.count ?? 0,
        charts: c.count ?? 0,
        guestCharts: g.count ?? 0,
        pointsIssued: issued,
        pointsSpent: spent,
      });
    })();
  }, []);

  if (!stats) return <Card className="glass-card p-6">Đang tải số liệu…</Card>;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} title="Thành viên" value={stats.members} color="from-blue-500 to-indigo-500" />
        <StatCard icon={FileText} title="Tổng lá số" value={stats.charts} color="from-purple-500 to-pink-500" />
        <StatCard icon={UserCircle} title="Lá số khách" value={stats.guestCharts} color="from-amber-500 to-orange-500" />
        <StatCard icon={Coins} title="Điểm đã cấp" value={stats.pointsIssued} color="from-emerald-500 to-teal-500" />
      </div>
      <Card className="glass-card p-6 shadow-elegant">
        <h3 className="font-display text-lg font-semibold">Hoạt động điểm</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-xs text-muted-foreground">Tổng điểm đã cấp</div>
            <div className="mt-1 font-display text-2xl font-bold text-emerald-700">+{stats.pointsIssued.toLocaleString("vi-VN")}</div>
          </div>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="text-xs text-muted-foreground">Tổng điểm đã dùng</div>
            <div className="mt-1 font-display text-2xl font-bold text-rose-700">-{stats.pointsSpent.toLocaleString("vi-VN")}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }: { icon: typeof Users; title: string; value: number; color: string }) {
  return (
    <Card className="glass-card relative overflow-hidden p-5 shadow-elegant">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-soft`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value.toLocaleString("vi-VN")}</div>
    </Card>
  );
}

/* ─── SETTINGS ─── */
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
        Khi admin lưu khoá ở đây, toàn bộ thành viên (kể cả khách) sẽ tự động dùng khoá này khi luận giải.
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={async () => { try { await setGeminiKey(val); toast.success(val ? "Đã lưu khoá" : "Đã xoá khoá"); } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi"); } }} className="gradient-primary text-primary-foreground">
          <Save className="mr-1.5 h-4 w-4" />Lưu khoá
        </Button>
        <Button variant="outline" onClick={async () => { try { await setGeminiKey(""); setVal(""); toast.success("Đã xoá khoá"); } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi"); } }}>Xoá</Button>
      </div>
      <div className="mt-4 rounded-md border border-dashed border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
        Trạng thái: {current ? <span className="font-semibold text-primary">Đang dùng khoá chung (••••{current.slice(-4)})</span> : "Đang dùng hạn mức hệ thống"}
      </div>
    </Card>
  );
}

/* ─── MEMBERS ─── */
type Member = { id: string; display_name: string | null; created_at: string; points: number };
type MemberHist = { id: string; ho_ten: string; created_at: string };

function MembersPanel() {
  const [rows, setRows] = useState<Member[] | null>(null);
  const [view, setView] = useState<Member | null>(null);
  const load = () => supabase.from("profiles").select("id,display_name,created_at,points").order("created_at", { ascending: false }).then(({ data, error }) => { if (error) toast.error(error.message); setRows((data as Member[]) ?? []); });
  useEffect(() => { load(); }, []);
  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <h3 className="mb-3 font-display text-lg font-semibold">Tổng thành viên: {rows.length}</h3>
      <div className="overflow-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Tên hiển thị</th>
            <th className="px-3 py-2 text-left">User ID</th>
            <th className="px-3 py-2 text-left">Ngày tham gia</th>
            <th className="px-3 py-2 text-right">Điểm</th>
            <th className="px-3 py-2 text-right">Thao tác</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 font-medium">{r.display_name || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right font-display font-bold text-amber-700">{(r.points ?? 0).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setView(r)}><Eye className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Chưa có thành viên nào.</td></tr>}
          </tbody>
        </table>
      </div>
      {view && <MemberDetail member={view} onClose={() => setView(null)} onChanged={() => { load(); }} />}
    </Card>
  );
}

function MemberDetail({ member, onClose, onChanged }: { member: Member; onClose: () => void; onChanged: () => void }) {
  const [amount, setAmount] = useState("2000");
  const [reason, setReason] = useState("Admin cộng điểm");
  const [adding, setAdding] = useState(false);
  const [hist, setHist] = useState<MemberHist[] | null>(null);
  const [txs, setTxs] = useState<{ id: string; amount: number; reason: string | null; created_at: string }[] | null>(null);
  const [points, setPoints] = useState(member.points);

  useEffect(() => {
    supabase.from("la_so_history").select("id,ho_ten,created_at").eq("user_id", member.id).order("created_at", { ascending: false }).then(({ data }) => setHist((data as MemberHist[]) ?? []));
    supabase.from("points_transactions").select("id,amount,reason,created_at").eq("user_id", member.id).order("created_at", { ascending: false }).then(({ data }) => setTxs((data as typeof txs) ?? []));
  }, [member.id]);

  const onAdd = async () => {
    const amt = Number(amount);
    if (!amt) return toast.error("Nhập số điểm hợp lệ");
    setAdding(true);
    const { error } = await supabase.rpc("admin_add_points", { _user_id: member.id, _amount: amt, _reason: reason });
    setAdding(false);
    if (error) return toast.error(error.message);
    toast.success(`Đã ${amt > 0 ? "cộng" : "trừ"} ${Math.abs(amt).toLocaleString("vi-VN")} điểm`);
    setPoints((p) => p + amt);
    // Reload tx
    supabase.from("points_transactions").select("id,amount,reason,created_at").eq("user_id", member.id).order("created_at", { ascending: false }).then(({ data }) => setTxs((data as typeof txs) ?? []));
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <Card className="max-h-[85vh] w-full max-w-3xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-display text-xl font-semibold">{member.display_name || "Thành viên"}</h4>
            <p className="font-mono text-xs text-muted-foreground">{member.id}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>Đóng</Button>
        </div>

        <div className="mb-4 rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coins className="h-7 w-7 text-amber-600" />
              <div>
                <div className="text-xs text-muted-foreground">Số dư điểm</div>
                <div className="font-display text-2xl font-bold text-amber-700">{points.toLocaleString("vi-VN")}</div>
              </div>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số điểm (âm = trừ)" />
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do" />
            <Button onClick={onAdd} disabled={adding} className="gradient-primary text-primary-foreground">
              <Plus className="mr-1.5 h-4 w-4" />{adding ? "…" : "Cộng/Trừ"}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[1000, 2000, 5000, 10000, 20000].map((n) => (
              <button key={n} onClick={() => setAmount(String(n))} className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-xs hover:border-primary/40">+{n.toLocaleString("vi-VN")}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h5 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold"><FileText className="h-4 w-4" />Lá số đã lập ({hist?.length ?? 0})</h5>
            <div className="max-h-64 overflow-auto rounded-md border border-border/60">
              {hist === null ? <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
                : hist.length === 0 ? <div className="p-3 text-sm text-muted-foreground">Chưa có.</div>
                : hist.map((h) => (
                  <div key={h.id} className="border-b border-border/60 px-3 py-2 text-sm last:border-0">
                    <div className="font-medium">{h.ho_ten}</div>
                    <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("vi-VN")}</div>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h5 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold"><Coins className="h-4 w-4" />Lịch sử điểm ({txs?.length ?? 0})</h5>
            <div className="max-h-64 overflow-auto rounded-md border border-border/60">
              {txs === null ? <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
                : txs.length === 0 ? <div className="p-3 text-sm text-muted-foreground">Chưa có giao dịch.</div>
                : txs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-sm last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{t.reason || "—"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("vi-VN")}</div>
                    </div>
                    <div className={`ml-2 font-display font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.amount >= 0 ? "+" : ""}{t.amount.toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── HISTORY (toàn bộ, có khách) ─── */
type Hist = { id: string; user_id: string | null; ho_ten: string; guest_name: string | null; created_at: string; result: any; input: any };

function HistoryPanel() {
  const [rows, setRows] = useState<Hist[] | null>(null);
  const [view, setView] = useState<Hist | null>(null);
  const [filter, setFilter] = useState<"all" | "members" | "guests">("all");
  const [search, setSearch] = useState("");

  const load = () => {
    supabase.from("la_so_history").select("id,user_id,ho_ten,guest_name,created_at,result,input").order("created_at", { ascending: false }).limit(500).then(({ data, error }) => {
      if (error) toast.error(error.message);
      setRows((data as Hist[]) ?? []);
    });
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
  const filtered = rows.filter((r) => {
    if (filter === "members" && !r.user_id) return false;
    if (filter === "guests" && r.user_id) return false;
    if (search && !r.ho_ten.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Card className="glass-card p-6 shadow-elegant">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">
          Tổng: {rows.length} · Hiển thị: {filtered.length}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Tìm theo họ tên…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <div className="inline-flex rounded-md border border-border/60">
            {(["all", "members", "guests"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                {f === "all" ? "Tất cả" : f === "members" ? "Thành viên" : "Khách"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Họ tên</th>
            <th className="px-3 py-2 text-left">Loại</th>
            <th className="px-3 py-2 text-left">User</th>
            <th className="px-3 py-2 text-left">Thời gian</th>
            <th className="px-3 py-2 text-right">Thao tác</th>
          </tr></thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 font-medium">{r.ho_ten}</td>
                <td className="px-3 py-2">
                  {r.user_id
                    ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Thành viên</span>
                    : <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">Khách</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.user_id ? r.user_id.slice(0, 8) + "…" : "—"}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setView(r)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Không có dữ liệu.</td></tr>}
          </tbody>
        </table>
      </div>

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setView(null)}>
          <Card className="max-h-[85vh] w-full max-w-3xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold">{view.ho_ten}</h4>
              <Button size="sm" variant="ghost" onClick={() => setView(null)}>Đóng</Button>
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              {view.user_id ? "Thành viên: " + view.user_id : "Khách vãng lai"} · {new Date(view.created_at).toLocaleString("vi-VN")}
            </div>
            <h5 className="mb-1 font-display text-sm font-semibold">Dữ liệu nhập</h5>
            <pre className="mb-3 overflow-auto rounded bg-muted/40 p-3 text-xs">{JSON.stringify(view.input, null, 2)}</pre>
            <h5 className="mb-1 font-display text-sm font-semibold">Kết quả</h5>
            <pre className="overflow-auto rounded bg-muted/40 p-3 text-xs">{JSON.stringify(view.result, null, 2)}</pre>
          </Card>
        </div>
      )}
    </Card>
  );
}
