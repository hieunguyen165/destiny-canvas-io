import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Sparkles, Loader2, Banknote, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMyPoints, useAppSettings } from "@/lib/admin";

export const Route = createFileRoute("/nap-diem")({
  head: () => ({ meta: [{ title: "Nạp điểm — Hệ Thống Thần Cơ" }] }),
  component: NapDiemPage,
});

const PRESETS = [10, 20, 50, 100, 200, 500];
const RATE = 1000; // 1 điểm = 1.000đ

type Topup = { id: string; amount_points: number; amount_vnd: number; status: string; note: string | null; created_at: string };

function NapDiemPage() {
  const points = useMyPoints();
  const s = useAppSettings(["payment_info"]);
  const paymentInfo = s.payment_info || "Vui lòng chuyển khoản theo nội dung dưới đây và bấm 'Tạo yêu cầu nạp'. Quản trị viên sẽ duyệt trong thời gian sớm nhất.";

  const [email, setEmail] = useState<string | null>(null);
  const [amount, setAmount] = useState("50");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<Topup[] | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("topup_requests")
      .select("id,amount_points,amount_vnd,status,note,created_at")
      .eq("user_id", u.user.id)
      .order("created_at", { ascending: false });
    setRows((data as Topup[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = Number(amount);
    if (!pts || pts < 1) return toast.error("Số điểm tối thiểu là 1");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Vui lòng đăng nhập");
    setSubmitting(true);
    const { error } = await supabase.from("topup_requests").insert({
      user_id: u.user.id,
      amount_points: pts,
      amount_vnd: pts * RATE,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Đã gửi yêu cầu nạp điểm. Vui lòng chờ admin duyệt.");
    setNote("");
    load();
  };

  if (!email) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card className="glass-card p-8 text-center shadow-elegant">
          <Coins className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-3 font-display text-2xl font-bold">Nạp điểm</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vui lòng đăng nhập để nạp điểm.</p>
          <Button asChild className="gradient-primary mt-5 text-primary-foreground"><Link to="/login">Đăng nhập</Link></Button>
        </Card>
      </div>
    );
  }

  const pts = Number(amount) || 0;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-elegant">
          <Coins className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Nạp điểm</h1>
          <p className="text-xs text-muted-foreground">
            Số dư: <strong className="text-amber-700">{points?.toLocaleString("vi-VN") ?? "…"}</strong> điểm · Tỉ giá: <strong>1 điểm = {RATE.toLocaleString("vi-VN")}đ</strong>
          </p>
        </div>
      </div>

      <Card className="glass-card mb-6 p-6 shadow-elegant">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label className="mb-2 block text-sm font-semibold">Chọn nhanh số điểm</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setAmount(String(n))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                    Number(amount) === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/60 hover:border-primary/40"
                  }`}
                >
                  {n.toLocaleString("vi-VN")} đ.
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-sm">Số điểm muốn nạp</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Số tiền cần chuyển</Label>
              <div className="flex h-10 items-center rounded-md border border-border/60 bg-amber-500/5 px-3 font-display text-lg font-bold text-amber-700">
                <Banknote className="mr-2 h-4 w-4" />{(pts * RATE).toLocaleString("vi-VN")} ₫
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Ghi chú (tuỳ chọn)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: đã chuyển khoản qua MB Bank lúc 14:30…" />
          </div>
          <div className="rounded-md border border-dashed border-border/70 bg-muted/40 p-3 text-xs whitespace-pre-line text-muted-foreground">
            <strong>Hướng dẫn nạp:</strong>{"\n"}{paymentInfo}
          </div>
          <Button type="submit" disabled={submitting} size="lg" className="gradient-primary w-full text-primary-foreground shadow-elegant">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi…</> : <><Sparkles className="mr-2 h-4 w-4" />Tạo yêu cầu nạp {pts.toLocaleString("vi-VN")} điểm</>}
          </Button>
        </form>
      </Card>

      <Card className="glass-card p-6 shadow-elegant">
        <h3 className="mb-3 font-display text-lg font-semibold">Yêu cầu nạp gần đây</h3>
        {!rows ? <p className="text-sm text-muted-foreground">Đang tải…</p>
          : rows.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>
          : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-3 text-sm">
                  <div>
                    <div className="font-display font-semibold">+{r.amount_points.toLocaleString("vi-VN")} điểm · {r.amount_vnd.toLocaleString("vi-VN")}đ</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("vi-VN")}{r.note ? ` · ${r.note}` : ""}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Đã duyệt</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-700"><XCircle className="h-3 w-3" />Từ chối</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Clock className="h-3 w-3" />Chờ duyệt</span>;
}
