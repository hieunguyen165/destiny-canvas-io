import type { KetQuaLaSo } from "@/lib/tuvi.functions";

// Bố cục thiên bàn 4x4 truyền thống. Vị trí 12 cung quanh viền.
// Index 0..11 theo thứ tự cung trong dữ liệu (Mệnh, Phụ Mẫu, ...).
// Bố trí ô trong lưới 4x4 (row, col):
const POSITIONS: Array<{ r: number; c: number }> = [
  { r: 1, c: 1 }, // Mệnh - giữa trái trên
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 0, c: 3 },
  { r: 1, c: 3 },
  { r: 2, c: 3 },
  { r: 3, c: 3 },
  { r: 3, c: 2 },
  { r: 3, c: 1 },
  { r: 3, c: 0 },
  { r: 2, c: 0 },
  { r: 1, c: 0 },
];

export function LaSoChart({ kq }: { kq: KetQuaLaSo }) {
  const { thongTinCoBan: t, luanGiai12Cung: cung } = kq;

  return (
    <div className="grid grid-cols-4 gap-1.5 rounded-lg border border-accent/40 bg-gradient-to-br from-amber-50/60 to-rose-50/40 p-2 sm:gap-2 sm:p-3">
      {Array.from({ length: 16 }).map((_, idx) => {
        const r = Math.floor(idx / 4);
        const c = idx % 4;
        const cungIdx = POSITIONS.findIndex((p) => p.r === r && p.c === c);
        if (cungIdx === -1) {
          // Ô giữa: gộp 2x2
          if (r === 1 && c === 1) {
            return (
              <div
                key={idx}
                className="col-span-2 row-span-2 flex flex-col items-center justify-center rounded-md border border-primary/30 bg-background/70 p-3 text-center"
              >
                <div className="font-display text-xs uppercase tracking-widest text-primary/70">
                  Thiên Bàn
                </div>
                <div className="mt-1 font-display text-base font-semibold sm:text-lg">
                  {t.hoTen}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {t.gioiTinh} · {t.gioSinh}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {t.ngayDuong}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  ÂL: {t.ngayAm}
                </div>
                <div className="mt-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {t.banMenh}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  Cung Mệnh: <span className="text-foreground">{t.cungMenh}</span>
                </div>
              </div>
            );
          }
          return null;
        }
        const cungData = cung[cungIdx];
        const isMenh = cungIdx === 0;
        return (
          <div
            key={idx}
            className={
              "min-h-[88px] rounded-md border p-1.5 text-[10px] leading-tight sm:min-h-[110px] sm:p-2 sm:text-[11px] " +
              (isMenh
                ? "border-primary/50 bg-primary/5"
                : "border-border/60 bg-background/60")
            }
          >
            <div className="font-display text-[11px] font-semibold text-primary sm:text-xs">
              {cungData?.ten ?? "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-amber-700 sm:text-[11px]">
              {cungData?.saoChinh}
            </div>
            <div className="mt-1 line-clamp-3 text-muted-foreground sm:line-clamp-4">
              {cungData?.luanGiai}
            </div>
          </div>
        );
      })}
    </div>
  );
}
