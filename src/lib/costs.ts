import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Khóa của các mục có thể tính phí. Cố định để admin cài giá an toàn. */
export const COST_KEYS = [
  // Lá số tử vi — luận chi tiết từng mục (12 box)
  { key: "ls_12cung", label: "Tử vi · Luận giải 12 cung" },
  { key: "ls_dai_tieu_han", label: "Tử vi · Đại - Tiểu hạn (hiện tại)" },
  { key: "ls_toan_bo_dai_han", label: "Tử vi · Toàn bộ đại hạn" },
  { key: "ls_tieu_han_nam", label: "Tử vi · Tiểu hạn theo năm" },
  { key: "ls_dien_cam_tam_the", label: "Tử vi · Diễn Cẩm Tam Thế" },
  { key: "ls_so_sanh_tong_luan", label: "Tử vi · Số sanh tổng luận" },
  { key: "ls_so_cau", label: "Tử vi · Số Cầu (12 cầu)" },
  { key: "ls_nghe_nghiep", label: "Tử vi · Nghề nghiệp thuận số" },
  { key: "ls_thien_can", label: "Tử vi · Thiên can hiệp tháng sanh" },
  { key: "ls_ngay_sang_hen", label: "Tử vi · Ngày sang hèn" },
  { key: "ls_so_co_nha", label: "Tử vi · Số có nhà" },
  { key: "ls_so_kiep_vc", label: "Tử vi · Số kiếp vợ chồng" },
  // Các module khác
  { key: "van_menh", label: "Luận Vận Mệnh (theo năm)" },
  { key: "hoang_dao", label: "Cung Hoàng Đạo" },
  { key: "ngay_tot", label: "Xem Ngày Tốt" },
  { key: "lich_am", label: "Đổi Lịch Âm/Dương" },
] as const;

export type CostKey = (typeof COST_KEYS)[number]["key"];

export const DEFAULT_COSTS: Record<string, number> = {
  ls_12cung: 2000,
  ls_dai_tieu_han: 2000,
  ls_toan_bo_dai_han: 2000,
  ls_tieu_han_nam: 2000,
  ls_dien_cam_tam_the: 2000,
  ls_so_sanh_tong_luan: 2000,
  ls_so_cau: 2000,
  ls_nghe_nghiep: 2000,
  ls_thien_can: 2000,
  ls_ngay_sang_hen: 2000,
  ls_so_co_nha: 2000,
  ls_so_kiep_vc: 2000,
  van_menh: 0,
  hoang_dao: 0,
  ngay_tot: 0,
  lich_am: 0,
};

const SETTING_KEY = "feature_costs";

export function parseCosts(raw: string | null | undefined): Record<string, number> {
  if (!raw) return { ...DEFAULT_COSTS };
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return { ...DEFAULT_COSTS, ...parsed };
  } catch {
    return { ...DEFAULT_COSTS };
  }
}

export async function fetchCosts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
  return parseCosts(data?.value);
}

export async function saveCosts(costs: Record<string, number>) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("app_settings").upsert({
    key: SETTING_KEY,
    value: JSON.stringify(costs),
    updated_by: u.user?.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("dctt-costs-change"));
}

export function useCosts() {
  const [costs, setCosts] = useState<Record<string, number>>(DEFAULT_COSTS);
  useEffect(() => {
    let cancel = false;
    const load = () => fetchCosts().then((c) => { if (!cancel) setCosts(c); });
    load();
    const onLocal = () => load();
    if (typeof window !== "undefined") window.addEventListener("dctt-costs-change", onLocal);
    return () => {
      cancel = true;
      if (typeof window !== "undefined") window.removeEventListener("dctt-costs-change", onLocal);
    };
  }, []);
  return costs;
}
