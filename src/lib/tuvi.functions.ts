import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachAuthHeader } from "./attach-auth";

const COST_LUAN_CHI_TIET = 2000;

/** Đọc khoá AI dùng chung từ app_settings (chỉ chạy trên server, dùng service role để bỏ qua RLS). */
async function getSharedAiKey(): Promise<string | undefined> {
  try {
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "gemini_api_key")
      .maybeSingle();
    const v = (data?.value || "").trim();
    return v || undefined;
  } catch {
    return undefined;
  }
}

const MODEL = "google/gemini-2.5-pro";
// Dùng flash cho free-tier (RPM/RPD cao hơn pro rất nhiều)
const GEMINI_DIRECT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY chưa được cấu hình");
  return createLovableAiGatewayProvider(key)(MODEL);
}

async function runViaGateway(prompt: string): Promise<string> {
  const { text } = await generateText({ model: getModel(), prompt, maxOutputTokens: 8192 });
  return text;
}

const BEEKNOEE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

async function runViaBeeknoee(prompt: string, key: string): Promise<string> {
  let lastErr = "";
  for (const model of BEEKNOEE_MODELS) {
    try {
      const res = await fetch("https://platform.beeknoee.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 8192,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const text = j.choices?.[0]?.message?.content ?? "";
        if (text) return text;
        lastErr = "Beeknoee không trả về nội dung";
        continue;
      }
      lastErr = `Beeknoee ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastErr || "Beeknoee không khả dụng");
}

async function runText(prompt: string, geminiKey?: string): Promise<string> {
  if (geminiKey && geminiKey.trim()) {
    const key = geminiKey.trim();
    // Khoá Beeknoee (OpenAI-compatible) — dùng prefix sk-bee-
    if (key.startsWith("sk-bee-") || key.startsWith("sk-")) {
      try {
        return await runViaBeeknoee(prompt, key);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        try { return await runViaGateway(prompt); }
        catch { throw new Error(`AI không khả dụng. ${msg}`); }
      }
    }
    let lastErr = "";
    for (const model of GEMINI_DIRECT_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          if (text) return text;
          lastErr = "Gemini không trả về nội dung";
          continue;
        }
        const body = await res.text();
        lastErr = `Gemini ${model} ${res.status}: ${body.slice(0, 200)}`;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }
    try {
      return await runViaGateway(prompt);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`AI không khả dụng. ${lastErr || msg}`);
    }
  }
  return runViaGateway(prompt);
}

/** Chạy 1 server-fn handler trả markdown an toàn — không bao giờ throw để tránh 500 SSR. */
async function safeRun(prompt: string, geminiKey?: string): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  try {
    const content = await runText(prompt, geminiKey);
    if (!content || !content.trim()) return { ok: false, error: "AI không trả về nội dung. Mời thử lại." };
    return { ok: true, content };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[tuvi.runText] failed:", msg);
    return { ok: false, error: msg || "AI tạm thời không khả dụng. Mời thử lại sau." };
  }
}



const laSoSchema = z.object({
  hoTen: z.string().min(1).max(80),
  gioiTinh: z.enum(["nam", "nu"]),
  loaiLich: z.enum(["duong", "am"]),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  gio: z.number().int().min(0).max(11),
});

const GIO_LABEL = [
  "Tý (23-1h)", "Sửu (1-3h)", "Dần (3-5h)", "Mão (5-7h)",
  "Thìn (7-9h)", "Tỵ (9-11h)", "Ngọ (11-13h)", "Mùi (13-15h)",
  "Thân (15-17h)", "Dậu (17-19h)", "Tuất (19-21h)", "Hợi (21-23h)",
];

// 14 phần kết quả
const cungSchema = z.object({
  ten: z.string(),       // Mệnh, Phụ Mẫu, Phúc Đức, ...
  saoChinh: z.string(),  // các sao chính trong cung
  luanGiai: z.string(),  // 1-3 câu
});

const ketQuaSchema = z.object({
  thongTinCoBan: z.object({
    hoTen: z.string(),
    gioiTinh: z.string(),
    ngayDuong: z.string(),
    ngayAm: z.string(),
    gioSinh: z.string(),
    banMenh: z.string(),       // VD: "Thiên Hà Thuỷ"
    canChiNam: z.string(),
    canChiThang: z.string(),
    canChiNgay: z.string(),
    canChiGio: z.string(),
    cungMenh: z.string(),
    cungThan: z.string(),
    saoChuMenh: z.string(),
    saoChuThan: z.string(),
  }),
  luanGiai12Cung: z.array(cungSchema),
  daiTieuHan: z.string(),
  toanBoDaiHan: z.array(z.object({
    giaiDoan: z.string(),
    cung: z.string(),
    luanGiai: z.string(),
  })),
  tieuHanTheoNam: z.array(z.object({
    nam: z.string(),
    canChi: z.string(),
    luanGiai: z.string(),
  })),
  dienCamTamThe: z.string(),
  soSanhTongLuan: z.string(),
  soCau: z.array(z.object({
    ten: z.string(),
    danhGia: z.string(),
    luanGiai: z.string(),
  })),
  ngheNghiepThuanSo: z.string(),
  thienCanHiepThangSanh: z.string(),
  ngaySangHen: z.string(),
  soCoNha: z.string(),
  soKiepVoChong: z.string(),
});

export type KetQuaLaSo = z.infer<typeof ketQuaSchema>;

const TEN_12_CUNG = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch",
  "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách",
  "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
];

const TEN_12_CAU = ["Tài", "Quan", "Ấn", "Phúc", "Thọ", "Lộc", "Mã", "Khốc", "Hư", "Hình", "Kiếp", "Sát"];
const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
const CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
const MENH_NAP_AM = ["Hải Trung Kim", "Lư Trung Hỏa", "Đại Lâm Mộc", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Sơn Đầu Hỏa", "Giản Hạ Thủy", "Thành Đầu Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc", "Tuyền Trung Thủy", "Ốc Thượng Thổ"];

type LaSoInput = z.infer<typeof laSoSchema>;

function canChiNam(nam: number) {
  return `${CAN[nam % 10]} ${CHI[nam % 12]}`;
}

function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function fallbackKetQua(data: LaSoInput): KetQuaLaSo {
  const gioSinh = `Giờ ${GIO_LABEL[data.gio]}`;
  const canChi = canChiNam(data.nam);
  const menh = MENH_NAP_AM[data.nam % MENH_NAP_AM.length];
  const cungMenh = TEN_12_CUNG[(data.thang + data.gio) % TEN_12_CUNG.length];
  const cungThan = TEN_12_CUNG[(data.ngay + data.gio + 5) % TEN_12_CUNG.length];
  const gioiTinh = data.gioiTinh === "nam" ? "Nam" : "Nữ";
  const lich = `${String(data.ngay).padStart(2, "0")}/${String(data.thang).padStart(2, "0")}/${data.nam}`;

  return {
    thongTinCoBan: {
      hoTen: data.hoTen,
      gioiTinh,
      ngayDuong: data.loaiLich === "duong" ? lich : "Quy đổi tham khảo theo ngày sinh đã nhập",
      ngayAm: data.loaiLich === "am" ? lich : "Âm lịch tham khảo theo tiết khí",
      gioSinh,
      banMenh: menh,
      canChiNam: canChi,
      canChiThang: `${CAN[(data.nam + data.thang) % 10]} ${CHI[(data.thang + 1) % 12]}`,
      canChiNgay: `${CAN[(data.nam + data.thang + data.ngay) % 10]} ${CHI[(data.ngay + 1) % 12]}`,
      canChiGio: `${CAN[(data.gio + data.ngay) % 10]} ${CHI[data.gio]}`,
      cungMenh,
      cungThan,
      saoChuMenh: "Tử Vi",
      saoChuThan: "Thiên Phủ",
    },
    luanGiai12Cung: TEN_12_CUNG.map((ten, i) => ({
      ten,
      saoChinh: ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thái Dương", "Thiên Đồng", "Liêm Trinh"][i % 6],
      luanGiai: `${ten} có khí vận ${i % 3 === 0 ? "vượng" : i % 3 === 1 ? "bình hòa" : "cần dưỡng"}; nên giữ tâm chính, chọn việc chắc chắn, tránh nóng vội mà hao tổn phúc duyên.`,
    })),
    daiTieuHan: `Đại hạn hiện thời thiên về tích lũy căn cơ, tiểu hạn năm nay cần giữ chữ tín trong giao tiếp và thận trọng khi quyết việc lớn. Người mệnh ${menh} gặp năm ${canChi} nên lấy ổn định làm gốc, tiến chậm mà bền.`,
    toanBoDaiHan: Array.from({ length: 8 }).map((_, i) => ({
      giaiDoan: `${i * 10 + 1}-${i * 10 + 10} tuổi`,
      cung: TEN_12_CUNG[(i + data.gio) % TEN_12_CUNG.length],
      luanGiai: i < 2 ? "Vận nền, học nết rèn thân; gia đạo và phúc khí ảnh hưởng mạnh." : i < 5 ? "Vận lập nghiệp, tài quan dần rõ; hợp làm việc có kế hoạch dài hơi." : "Vận hậu, trọng an cư, dưỡng phúc, truyền kinh nghiệm cho con cháu.",
    })),
    tieuHanTheoNam: [2026, 2027, 2028, 2029].map((nam) => ({
      nam: String(nam),
      canChi: canChiNam(nam),
      luanGiai: "Năm này nên ưu tiên việc chắc chắn, giữ hòa khí trong nhà và tránh đầu tư theo cảm xúc; có quý nhân khi biết nhún nhường.",
    })),
    dienCamTamThe: "Tiền vận còn phải tự lực, trung vận mở dần nhờ bền chí, hậu vận được hưởng phần an ổn nếu biết tu tâm tích đức. Số này kỵ hơn thua lời nói, hợp đi đường chính đạo.",
    soSanhTongLuan: "Tổng luận cho thấy căn số có duyên học hỏi, làm việc cần sự tỉ mỉ và uy tín. Vận tốt đến khi biết giữ chữ tín, tránh ôm đồm và biết chọn người đồng hành.",
    soCau: TEN_12_CAU.map((ten, i) => ({
      ten,
      danhGia: i % 4 === 0 ? "Kiết" : i % 4 === 1 ? "Bình" : i % 4 === 2 ? "Cần giữ" : "Hung nhẹ",
      luanGiai: `Cầu ${ten} ứng ở mức tham khảo; nên lấy thiện tâm, kỷ luật và sự tỉnh táo để tăng phần cát, giảm phần hung.`,
    })),
    ngheNghiepThuanSo: "Thuận các nghề cần sự tin cậy, phân tích, tư vấn, quản trị, giáo dục, kỹ thuật hoặc kinh doanh có nền tảng rõ ràng. Không hợp lối làm ăn chụp giật, lời nhanh mà thiếu căn cơ.",
    thienCanHiepThangSanh: "Thiên can phối tháng sinh cho thấy nên chọn nghề có nhịp ổn định, càng tích lũy kinh nghiệm càng phát. Gặp thời thì tiến, chưa gặp thời thì học thêm nghề phụ để dưỡng vận.",
    ngaySangHen: "Ngày sinh có khí chất tự trọng, gặp hoàn cảnh thuận thì dễ được trọng dụng; lúc khó cần giữ lễ nghĩa, không vì nhất thời mà phá uy tín lâu dài.",
    soCoNha: "Số có duyên an cư khi biết tích lũy đều đặn và chọn nơi ở hợp sinh kế. Nhà cửa nên tránh quyết định vội, hợp mua sửa theo từng bước chắc chắn.",
    soKiepVoChong: "Duyên vợ chồng trọng chữ nhẫn và sự minh bạch. Kỵ im lặng kéo dài, hợp cùng bàn việc tiền bạc và gia đạo thì tình phần thêm bền.",
  };
}

export const lapLaSo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => laSoSchema.parse(data))
  .handler(async ({ data }) => {
    return { ok: true as const, data: fallbackKetQua(data) };
  });

// Luận giải chuyên sâu cho từng mục — gọi AI khi user bấm "Xem thêm"
const luanSauSchema = z.object({
  muc: z.string().min(1).max(120),
  tomTat: z.string().min(1).max(2000),
  thongTin: z.object({
    hoTen: z.string(),
    gioiTinh: z.string(),
    canChiNam: z.string(),
    banMenh: z.string(),
    cungMenh: z.string(),
    cungThan: z.string(),
    gioSinh: z.string(),
  }),
});

export const luanSau = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => luanSauSchema.parse(d))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any };
    // Trừ điểm server-side qua RPC (kiểm tra số dư + log transaction). Throw nếu không đủ.
    const { error: spendErr } = await ctx.supabase.rpc("spend_points", {
      _amount: COST_LUAN_CHI_TIET,
      _reason: `Luận chi tiết: ${data.muc}`,
    });
    if (spendErr) {
      const msg = spendErr.message || "";
      if (msg.includes("insufficient_points")) return { ok: false as const, error: "insufficient_points" };
      return { ok: false as const, error: msg || "Không thể trừ điểm." };
    }
    const t = data.thongTin;
    const sharedKey = await getSharedAiKey();
    const r = await safeRun(
      `Bạn là thầy tử vi cổ truyền Việt Nam, văn phong trang trọng, sâu sắc, sử dụng thuật ngữ tử vi (cung, sao, can chi, ngũ hành).

THÔNG TIN ĐƯƠNG SỐ:
- Họ tên: ${t.hoTen} (${t.gioiTinh})
- Năm sinh can chi: ${t.canChiNam}
- Bản mệnh: ${t.banMenh}
- Cung Mệnh: ${t.cungMenh}; Cung Thân: ${t.cungThan}
- Giờ sinh: ${t.gioSinh}

MỤC CẦN LUẬN SÂU: "${data.muc}"

Tóm lược ban đầu (để mở rộng, không lặp y nguyên):
"""${data.tomTat}"""

Hãy viết LUẬN GIẢI CHUYÊN SÂU bằng tiếng Việt, MARKDOWN, gồm các phần:
## Căn Nguyên
(gốc rễ vận số ở mục này, tham chiếu can chi - ngũ hành - cung sao, 3-4 câu)
## Diễn Giải Chi Tiết
(4-6 câu phân tích cặn kẽ ý nghĩa, biểu hiện cụ thể trong đời sống)
## Thuận & Nghịch
(2 câu thuận, 2 câu nghịch nên tránh)
## Lời Khuyên
(3-4 gạch đầu dòng cụ thể, hành động được)

Văn phong tử vi cổ truyền, súc tích nhưng sâu, không lan man.`,
      sharedKey,
    );
    return r;
  });

const vanMenhSchema = z.object({
  conGiap: z.string().min(1),
  nam: z.number().int().min(2020).max(2100),
});

export const vanMenh = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => vanMenhSchema.parse(d))
  .handler(async ({ data }) => {
    const sharedKey = await getSharedAiKey();
    const r = await safeRun(
      `Luận giải vận mệnh năm ${data.nam} cho người tuổi ${data.conGiap} bằng tiếng Việt, văn phong tử vi cổ truyền.
Trả về MARKDOWN với các phần: ## Tổng Quan, ## Tài Lộc, ## Công Việc, ## Tình Duyên, ## Sức Khoẻ, ## Lưu Ý, ## Màu & Số May Mắn. Mỗi phần 2-3 câu súc tích.`,
      sharedKey,
    );
    return r;
  });

const cungHDSchema = z.object({ cung: z.string().min(1) });

export const luanCungHoangDao = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => cungHDSchema.parse(d))
  .handler(async ({ data }) => {
    const sharedKey = await getSharedAiKey();
    const r = await safeRun(
      `Tử vi tuần này cho cung hoàng đạo ${data.cung} (phương Tây), bằng tiếng Việt.
Markdown gồm: ## Tổng Quan Tuần, ## Sự Nghiệp, ## Tài Chính, ## Tình Yêu, ## Sức Khoẻ, ## Lời Khuyên. Mỗi phần 2-3 câu.`,
      sharedKey,
    );
    return r;
  });

const ngayTotSchema = z.object({
  loaiViec: z.string().min(1),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(2024).max(2100),
});

export const ngayTot = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => ngayTotSchema.parse(d))
  .handler(async ({ data }) => {
    const sharedKey = await getSharedAiKey();
    const r = await safeRun(
      `Liệt kê 5-8 ngày tốt trong tháng ${data.thang}/${data.nam} (dương lịch) phù hợp cho việc "${data.loaiViec}" theo lịch can chi Việt Nam.
Trả về MARKDOWN dạng bảng:
| Ngày dương | Ngày âm | Can Chi | Giờ tốt | Lý do |
Sau bảng thêm phần ## Ngày Cần Tránh (1-2 ngày xấu) và ## Lời Khuyên (2 câu).`,
      sharedKey,
    );
    return r;
  });

const lichAmSchema = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  chieu: z.enum(["d2a", "a2d"]),
});

export const doiLich = createServerFn({ method: "POST" })
  .middleware([attachAuthHeader, requireSupabaseAuth])
  .inputValidator((d: unknown) => lichAmSchema.parse(d))
  .handler(async ({ data }) => {
    const huong = data.chieu === "d2a" ? "Dương lịch sang Âm lịch" : "Âm lịch sang Dương lịch";
    const sharedKey = await getSharedAiKey();
    const r = await safeRun(
      `Hãy đổi ngày ${data.ngay}/${data.thang}/${data.nam} từ ${huong} một cách chính xác.
Trả về MARKDOWN ngắn gọn:
- **Dương lịch:** ...
- **Âm lịch:** ...
- **Can Chi ngày:** ...
- **Can Chi tháng:** ...
- **Can Chi năm:** ...
- **Tiết khí:** ...
- **Đánh giá:** Hoàng đạo / Hắc đạo, có nên làm việc lớn không (1 câu).`,
      sharedKey,
    );
    return r;
  });
