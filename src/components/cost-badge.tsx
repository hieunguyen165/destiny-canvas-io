import { Coins, Gift } from "lucide-react";
import { useCosts } from "@/lib/costs";
import { cn } from "@/lib/utils";

/** Niêm yết giá cho mỗi nút trừ điểm. Hiển thị "MIỄN PHÍ" nếu cost = 0. */
export function CostBadge({ costKey, className }: { costKey: string; className?: string }) {
  const costs = useCosts();
  const cost = costs[costKey] ?? 0;
  if (cost <= 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700", className)}>
        <Gift className="h-3 w-3" /> MIỄN PHÍ
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700", className)}>
      <Coins className="h-3 w-3" /> {cost.toLocaleString("vi-VN")} điểm/lần
    </span>
  );
}

/** Hook trả nhãn ngắn để gắn vào label nút: "(MIỄN PHÍ)" hoặc "(2.000 điểm)". */
export function useCostLabel(costKey: string): string {
  const costs = useCosts();
  const cost = costs[costKey] ?? 0;
  return cost <= 0 ? "MIỄN PHÍ" : `${cost.toLocaleString("vi-VN")} điểm`;
}
