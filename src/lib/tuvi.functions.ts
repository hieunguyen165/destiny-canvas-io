import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const MODEL = "google/gemini-2.5-pro";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY chưa được cấu hình");
  return createLovableAiGatewayProvider(key)(MODEL);
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
    const model = getModel();
    const prompt = `Bạn là thầy tử vi lão luyện theo phương pháp Diễn Cẩm Tam Thế cổ truyền Việt Nam.
Hãy luận giải lá số tử vi cho người sau đây. Văn phong cổ kính, súc tích, tiếng Việt thuần.

THÔNG TIN:
- Họ tên: ${data.hoTen}
- Giới tính: ${data.gioiTinh === "nam" ? "Nam" : "Nữ"}
- Ngày sinh: ${data.ngay}/${data.thang}/${data.nam} (${data.loaiLich === "duong" ? "Dương lịch" : "Âm lịch"})
- Giờ sinh: Giờ ${GIO_LABEL[data.gio]}

TRẢ VỀ JSON theo schema. Lưu ý:
- "luanGiai12Cung" PHẢI đúng 12 mục theo thứ tự: ${TEN_12_CUNG.join(", ")}.
- "soCau" PHẢI đúng 12 mục theo thứ tự: Tài, Quan, Ấn, Phúc, Thọ, Lộc, Mã, Khốc, Hư, Hình, Kiếp, Sát.
- "toanBoDaiHan" chia 6-10 giai đoạn 10 năm.
- "tieuHanTheoNam" gồm 3-5 năm gần nhất (kể cả năm nay 2026).
- Mọi luận giải mang tính tham khảo dưới góc nhìn văn hoá, không khẳng định tuyệt đối.`;

    const { object } = await generateObject({
      model,
      schema: ketQuaSchema,
      prompt,
    });
    return { ok: true as const, data: object };
  });

// Các function khác giữ nguyên
const vanMenhSchema = z.object({
  conGiap: z.string().min(1),
  nam: z.number().int().min(2020).max(2100),
});

export const vanMenh = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => vanMenhSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const { text } = await generateText({
      model,
      prompt: `Luận giải vận mệnh năm ${data.nam} cho người tuổi ${data.conGiap} bằng tiếng Việt, văn phong tử vi cổ truyền.
Trả về MARKDOWN với các phần: ## 🌟 Tổng Quan, ## 💰 Tài Lộc, ## 💼 Công Việc, ## ❤️ Tình Duyên, ## 🌿 Sức Khoẻ, ## ⚠️ Lưu Ý, ## 🎨 Màu & Số May Mắn. Mỗi phần 2-3 câu súc tích.`,
    });
    return { ok: true as const, content: text };
  });

const cungHDSchema = z.object({ cung: z.string().min(1) });

export const luanCungHoangDao = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cungHDSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const { text } = await generateText({
      model,
      prompt: `Tử vi tuần này cho cung hoàng đạo ${data.cung} (phương Tây), bằng tiếng Việt.
Markdown gồm: ## ✨ Tổng Quan Tuần, ## 💼 Sự Nghiệp, ## 💰 Tài Chính, ## ❤️ Tình Yêu, ## 🌿 Sức Khoẻ, ## 🍀 Lời Khuyên. Mỗi phần 2-3 câu.`,
    });
    return { ok: true as const, content: text };
  });

const ngayTotSchema = z.object({
  loaiViec: z.string().min(1),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(2024).max(2100),
});

export const ngayTot = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ngayTotSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const { text } = await generateText({
      model,
      prompt: `Liệt kê 5-8 ngày tốt trong tháng ${data.thang}/${data.nam} (dương lịch) phù hợp cho việc "${data.loaiViec}" theo lịch can chi Việt Nam.
Trả về MARKDOWN dạng bảng:
| Ngày dương | Ngày âm | Can Chi | Giờ tốt | Lý do |
Sau bảng thêm phần ## ⚠️ Ngày Cần Tránh (1-2 ngày xấu) và ## 🌿 Lời Khuyên (2 câu).`,
    });
    return { ok: true as const, content: text };
  });

const lichAmSchema = z.object({
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  chieu: z.enum(["d2a", "a2d"]),
});

export const doiLich = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lichAmSchema.parse(d))
  .handler(async ({ data }) => {
    const model = getModel();
    const huong = data.chieu === "d2a" ? "Dương lịch sang Âm lịch" : "Âm lịch sang Dương lịch";
    const { text } = await generateText({
      model,
      prompt: `Hãy đổi ngày ${data.ngay}/${data.thang}/${data.nam} từ ${huong} một cách chính xác.
Trả về MARKDOWN ngắn gọn:
- **Dương lịch:** ...
- **Âm lịch:** ...
- **Can Chi ngày:** ...
- **Can Chi tháng:** ...
- **Can Chi năm:** ...
- **Tiết khí:** ...
- **Đánh giá:** Hoàng đạo / Hắc đạo, có nên làm việc lớn không (1 câu).`,
    });
    return { ok: true as const, content: text };
  });
