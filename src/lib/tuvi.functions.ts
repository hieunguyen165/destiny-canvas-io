import { createServerFn } from "@tanstack/react-start";
import { generateObject, generateText } from "ai";
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
