import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, KeyRound, Save, Users, History, Settings as SettingsIcon, Trash2, Eye, LayoutDashboard, Coins, Plus, UserCircle, FileText, Sparkles, Info, Wallet, Newspaper, Edit3, ExternalLink, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { setGeminiKey, useGeminiKey, useIsAdmin, useAppSettings, setAppSetting } from "@/lib/admin";
import { checkIsAdmin } from "@/lib/admin.functions";
import { COST_KEYS, DEFAULT_COSTS, fetchCosts, saveCosts } from "@/lib/costs";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Quản trị — Hệ Thống Thần Cơ" }] }),
  // Server-side guard: chỉ chạy trên client để tránh prerender 401.
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const res = await checkIsAdmin();
      if (!res?.isAdmin) {
        throw redirect({ to: "/" });
      }
    } catch (e) {
      // Chưa đăng nhập (401) hoặc lỗi mạng → đẩy về login.
      const isRedirectErr = e && typeof e === "object" && "to" in e;
      if (isRedirectErr) throw e;
      throw redirect({ to: "/login" });
    }
  },
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

  return <AdminShell email={email} />;
}

const ADMIN_MENU = [
  { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { key: "members", label: "Thành viên", icon: Users },
  { key: "topups", label: "Nạp điểm", icon: Wallet },
  { key: "pricing", label: "Giá điểm", icon: Coins },
  { key: "history", label: "Lịch sử lá số", icon: History },
  { key: "posts", label: "Bài viết SEO", icon: Newspaper },
  { key: "info", label: "Thông tin", icon: Info },
  { key: "settings", label: "Cài đặt", icon: SettingsIcon },
] as const;

type AdminKey = (typeof ADMIN_MENU)[number]["key"];

function AdminShell({ email }: { email: string }) {
  const [active, setActive] = useState<AdminKey>(() => {
    if (typeof window === "undefined") return "dashboard";
    const h = window.location.hash.replace("#", "") as AdminKey;
    return ADMIN_MENU.some((m) => m.key === h) ? h : "dashboard";
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${active}`);
  }, [active]);
  const current = ADMIN_MENU.find((m) => m.key === active)!;

  return (
    <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-8 sm:px-6">
      {/* Sidebar */}
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-64 shrink-0 self-start overflow-y-auto rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft backdrop-blur lg:block">
        <div className="mb-4 flex items-center gap-2.5 border-b border-border/50 pb-4">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-elegant">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-semibold">Khu Quản Trị</div>
            <div className="truncate text-[10px] text-muted-foreground">{email}</div>
          </div>
        </div>
        <nav className="space-y-1">
          {ADMIN_MENU.map((m) => {
            const Icon = m.icon;
            const on = m.key === active;
            return (
              <button
                key={m.key}
                onClick={() => setActive(m.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "bg-primary/12 text-primary shadow-soft"
                    : "text-foreground/75 hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-border/50 pt-4">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/"><ChevronLeft className="mr-1.5 h-3.5 w-3.5" />Về trang chủ</Link>
          </Button>
        </div>
      </aside>

      {/* Mobile select */}
      <div className="lg:hidden fixed bottom-4 left-1/2 z-30 -translate-x-1/2">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as AdminKey)}
          className="rounded-full border border-border bg-background/95 px-4 py-2 text-sm font-semibold shadow-elegant backdrop-blur"
        >
          {ADMIN_MENU.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </div>

      <main className="min-w-0 flex-1">
        <div className="mb-5 flex items-center gap-3">
          <current.icon className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{current.label}</h1>
        </div>
        {active === "dashboard" && <Dashboard />}
        {active === "members" && <MembersPanel />}
        {active === "topups" && <TopupsPanel />}
        {active === "pricing" && <PricingPanel />}
        {active === "history" && <HistoryPanel />}
        {active === "posts" && <PostsPanel />}
        {active === "info" && <InfoPanel />}
        {active === "settings" && <SettingsPanel />}
      </main>
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

/* ─── INFO (footer/website info) ─── */
const FOOTER_KEYS = ["footer_about", "footer_note", "footer_copyright", "footer_contact"];

function InfoPanel() {
  const current = useAppSettings(FOOTER_KEYS);
  const [about, setAbout] = useState("");
  const [note, setNote] = useState("");
  const [copyright, setCopyright] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAbout(current.footer_about ?? "");
    setNote(current.footer_note ?? "");
    setCopyright(current.footer_copyright ?? "");
    setContact(current.footer_contact ?? "");
  }, [current.footer_about, current.footer_note, current.footer_copyright, current.footer_contact]);

  const onSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setAppSetting("footer_about", about),
        setAppSetting("footer_note", note),
        setAppSetting("footer_copyright", copyright),
        setAppSetting("footer_contact", contact),
      ]);
      toast.success("Đã lưu thông tin website");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card p-6 shadow-elegant">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-semibold">Thông tin Footer & Website</h3>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Nội dung dưới đây hiển thị ở chân trang (footer) trên toàn bộ website. Thay đổi sẽ tự động cập nhật cho mọi khách truy cập.
      </p>

      <div className="space-y-5">
        <div>
          <Label className="mb-1.5 block text-sm font-semibold">Giới thiệu (cột trái footer)</Label>
          <Textarea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tinh hoa tử vi cổ truyền — soi tỏ vận mệnh…" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-semibold">Thông tin liên hệ (tuỳ chọn)</Label>
          <Textarea rows={3} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Hotline: 09xx xxx xxx&#10;Email: contact@hethongthanco.vn" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-semibold">Lưu ý (cột phải footer)</Label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mọi luận giải mang tính tham khảo…" />
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-semibold">Dòng bản quyền</Label>
          <Input value={copyright} onChange={(e) => setCopyright(e.target.value)} placeholder={`© ${new Date().getFullYear()} Hệ Thống Thần Cơ…`} />
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={onSave} disabled={saving} className="gradient-primary text-primary-foreground">
            <Save className="mr-1.5 h-4 w-4" />{saving ? "Đang lưu…" : "Lưu thông tin"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ─── PRICING (giá điểm từng mục) ─── */
function PricingPanel() {
  const [costs, setCosts] = useState<Record<string, number> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCosts().then(setCosts); }, []);

  const update = (key: string, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setCosts((c) => ({ ...(c ?? {}), [key]: n }));
  };

  const onSave = async () => {
    if (!costs) return;
    setSaving(true);
    try { await saveCosts(costs); toast.success("Đã lưu bảng giá"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi lưu"); }
    finally { setSaving(false); }
  };

  const onResetDefaults = () => setCosts({ ...DEFAULT_COSTS });

  if (!costs) return <Card className="glass-card p-6">Đang tải bảng giá…</Card>;

  return (
    <Card className="glass-card p-6 shadow-elegant">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-600" />
          <h3 className="font-display text-lg font-semibold">Bảng giá điểm cho từng mục luận giải</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onResetDefaults}>Khôi phục mặc định</Button>
          <Button onClick={onSave} disabled={saving} className="gradient-primary text-primary-foreground">
            <Save className="mr-1.5 h-4 w-4" />{saving ? "Đang lưu…" : "Lưu bảng giá"}
          </Button>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Đặt số điểm cần trừ khi người dùng sử dụng từng tính năng. Đặt <strong>0</strong> để miễn phí.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {COST_KEYS.map((c) => (
          <div key={c.key} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.key}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                step={100}
                value={costs[c.key] ?? 0}
                onChange={(e) => update(c.key, e.target.value)}
                className="w-28 text-right font-display font-semibold"
              />
              <span className="text-xs text-muted-foreground">điểm</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── TOPUPS (duyệt nạp điểm) ─── */
type Topup = { id: string; user_id: string; amount_points: number; amount_vnd: number; status: string; note: string | null; created_at: string };

function TopupsPanel() {
  const [rows, setRows] = useState<Topup[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = () => {
    let q = supabase.from("topup_requests").select("*").order("created_at", { ascending: false });
    if (filter === "pending") q = q.eq("status", "pending");
    q.then(({ data, error }) => { if (error) toast.error(error.message); setRows((data as Topup[]) ?? []); });
  };
  useEffect(load, [filter]);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_topup", { _id: id });
    if (error) return toast.error(error.message);
    toast.success("Đã duyệt nạp điểm");
    load();
  };
  const reject = async (id: string) => {
    const { error } = await supabase.rpc("reject_topup", { _id: id });
    if (error) return toast.error(error.message);
    toast.success("Đã từ chối");
    load();
  };

  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Yêu cầu nạp điểm ({rows.length})</h3>
        <div className="inline-flex rounded-md border border-border/60">
          {(["pending", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
              {f === "pending" ? "Chờ duyệt" : "Tất cả"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Thời gian</th>
            <th className="px-3 py-2 text-left">User</th>
            <th className="px-3 py-2 text-right">Điểm</th>
            <th className="px-3 py-2 text-right">VNĐ</th>
            <th className="px-3 py-2 text-left">Ghi chú</th>
            <th className="px-3 py-2 text-left">Trạng thái</th>
            <th className="px-3 py-2 text-right">Thao tác</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 text-xs">{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.user_id.slice(0, 8)}…</td>
                <td className="px-3 py-2 text-right font-display font-bold text-amber-700">{r.amount_points.toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right">{r.amount_vnd.toLocaleString("vi-VN")}đ</td>
                <td className="px-3 py-2 text-xs">{r.note || "—"}</td>
                <td className="px-3 py-2">
                  {r.status === "pending" && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">Chờ</span>}
                  {r.status === "approved" && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700">Đã duyệt</span>}
                  {r.status === "rejected" && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs text-rose-700">Từ chối</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" variant="default" className="mr-1 gradient-primary text-primary-foreground" onClick={() => approve(r.id)}>Duyệt</Button>
                      <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Từ chối</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Không có yêu cầu nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── POSTS (CMS blog SEO) ─── */
type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function PostsPanel() {
  const [rows, setRows] = useState<Post[] | null>(null);
  const [editing, setEditing] = useState<Post | "new" | null>(null);

  const load = () => {
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setRows((data as Post[]) ?? []);
      });
  };
  useEffect(load, []);

  const onDelete = async (id: string) => {
    if (!confirm("Xoá bài viết này?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá");
    load();
  };

  if (editing) {
    return (
      <PostEditor
        post={editing === "new" ? null : editing}
        onBack={() => { setEditing(null); load(); }}
      />
    );
  }

  if (!rows) return <Card className="glass-card p-6">Đang tải…</Card>;
  return (
    <Card className="glass-card p-6 shadow-elegant">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Tổng bài viết: {rows.length}</h3>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/blog" target="_blank"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Xem blog</Link>
          </Button>
          <Button onClick={() => setEditing("new")} className="gradient-primary text-primary-foreground">
            <Plus className="mr-1.5 h-4 w-4" />Bài viết mới
          </Button>
        </div>
      </div>
      <div className="overflow-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-accent/40 font-display"><tr>
            <th className="px-3 py-2 text-left">Tiêu đề</th>
            <th className="px-3 py-2 text-left">Slug</th>
            <th className="px-3 py-2 text-left">Trạng thái</th>
            <th className="px-3 py-2 text-left">Cập nhật</th>
            <th className="px-3 py-2 text-right">Thao tác</th>
          </tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-border/60 odd:bg-background/40">
                <td className="px-3 py-2 font-medium">{p.title}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">/{p.slug}</td>
                <td className="px-3 py-2">
                  {p.status === "published"
                    ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700">Đã đăng</span>
                    : <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700">Nháp</span>}
                </td>
                <td className="px-3 py-2 text-xs">{new Date(p.updated_at).toLocaleString("vi-VN")}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {p.status === "published" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/blog/$slug" params={{ slug: p.slug }} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Edit3 className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                Chưa có bài viết. Bấm <strong>Bài viết mới</strong> để bắt đầu viết bài SEO đầu tiên.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PostEditor({ post, onBack }: { post: Post | null; onBack: () => void }) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? "");
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? "");
  const [keywords, setKeywords] = useState(post?.keywords ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const save = async () => {
    if (!title.trim()) return toast.error("Nhập tiêu đề");
    if (!slug.trim()) return toast.error("Slug không hợp lệ");
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content,
        cover_url: coverUrl.trim() || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDesc.trim() || null,
        keywords: keywords.trim() || null,
        status,
        published_at: status === "published" ? (post?.published_at ?? new Date().toISOString()) : null,
        author_id: post?.author_id ?? u.user?.id ?? null,
      };
      if (isNew) {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
        toast.success("Đã tạo bài viết");
      } else {
        const { error } = await supabase.from("posts").update(payload).eq("id", post!.id);
        if (error) throw error;
        toast.success("Đã lưu bài viết");
      }
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1.5 h-4 w-4" />Quay lại danh sách
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />{preview ? "Sửa" : "Xem trước"}
          </Button>
          <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground">
            <Save className="mr-1.5 h-4 w-4" />{saving ? "Đang lưu…" : "Lưu bài viết"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <Card className="glass-card p-5 shadow-elegant">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiêu đề</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Cách xem lá số tử vi 2026 chi tiết nhất"
            className="font-display text-lg"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">URL:</span>
            <span className="font-mono text-muted-foreground">/blog/</span>
            <Input
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
              placeholder="duong-dan-bai-viet"
              className="h-7 max-w-xs font-mono text-xs"
            />
          </div>
          <Label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tóm tắt (hiển thị ở danh sách & SEO)</Label>
          <Textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Đoạn mô tả ngắn 120-160 ký tự…"
          />

          <Label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nội dung (Markdown — hỗ trợ ## tiêu đề, **đậm**, [link](url), - danh sách, bảng)
          </Label>
          {preview ? (
            <div className="rounded-md border border-border/60 bg-background/50 p-4 min-h-[300px]">
              {content.trim() ? <Prose content={content} /> : <p className="text-sm text-muted-foreground">(Chưa có nội dung)</p>}
            </div>
          ) : (
            <Textarea
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`## Mở đầu\n\nNội dung bài viết tại đây…\n\n## Phần 1\n\n- Ý 1\n- Ý 2`}
              className="font-mono text-sm"
            />
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="glass-card p-5 shadow-elegant">
            <h4 className="mb-3 font-display text-sm font-semibold">Xuất bản</h4>
            <Label className="mb-1.5 block text-xs">Trạng thái</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="draft">Nháp (chỉ admin xem)</option>
              <option value="published">Đã đăng (công khai)</option>
            </select>
            {post?.published_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Đăng lúc: {new Date(post.published_at).toLocaleString("vi-VN")}
              </p>
            )}
          </Card>

          <Card className="glass-card p-5 shadow-elegant">
            <h4 className="mb-3 font-display text-sm font-semibold">Ảnh bìa</h4>
            <Label className="mb-1.5 block text-xs">URL ảnh (dùng cho thumbnail & OG image)</Label>
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
            {coverUrl && (
              <img src={coverUrl} alt="" className="mt-2 aspect-video w-full rounded-md object-cover" loading="lazy" />
            )}
          </Card>

          <Card className="glass-card p-5 shadow-elegant">
            <h4 className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />Tối ưu SEO
            </h4>
            <Label className="mb-1.5 block text-xs">Meta title (mặc định lấy tiêu đề)</Label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="≤ 60 ký tự" maxLength={70} />
            <p className="mt-1 text-[10px] text-muted-foreground">{(metaTitle || title).length}/60 ký tự</p>

            <Label className="mb-1.5 mt-3 block text-xs">Meta description</Label>
            <Textarea
              rows={3}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              placeholder="Mô tả ngắn xuất hiện trên Google. 120-160 ký tự là tối ưu."
              maxLength={200}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">{(metaDesc || excerpt || "").length}/160 ký tự</p>

            <Label className="mb-1.5 mt-3 block text-xs">Từ khoá (phân tách bằng dấu phẩy)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="tử vi, vận mệnh, 2026" />
          </Card>
        </div>
      </div>
    </div>
  );
}
