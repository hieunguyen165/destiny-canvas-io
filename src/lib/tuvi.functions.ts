import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const MODEL = "google/gemini-2.5-flash";

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
  gio: z.number().int().min(0).max(11), // index giờ Tý..Hợi
});

const GIO_LABEL = [
  "Tý (23-1h)", "Sửu (1-3h)", "Dần (3-5h)", "Mão (5-7h)",
  "Thìn (7-9h)", "Tỵ (9-11h)", "Ngọ (11-13h)", "Mùi (13-15h)",
  "Thân (15-17h)", "Dậu (17-19h)", "Tuất (19-21h)", "Hợi (21-23h)",
];

export const lapLaSo = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => laSoSchema.parse(data))
  .handler(async ({ data }) => {
    const model = getModel();
    const prompt = `Bạn là một thầy tử vi lão luyện theo phương pháp Diễn Cầm Tam Thế cổ truyền của Việt Nam.
Hãy luận giải lá số tử vi cho người sau đây bằng văn phong cổ kính, trang trọng nhưng dễ hiểu, có cấu trúc.

THÔNG TIN:
- Họ tên: ${data.hoTen}
- Giới tính: ${data.gioiTinh === "nam" ? "Nam" : "Nữ"}
- Ngày sinh: ${data.ngay}/${data.thang}/${data.nam} (${data.loaiLich === "duong" ? "Dương lịch" : "Âm lịch"})
- Giờ sinh: Giờ ${GIO_LABEL[data.gio]}

YÊU CẦU TRẢ LỜI THEO ĐÚNG ĐỊNH DẠNG MARKDOWN SAU (không thêm phần giới thiệu):

## ⚜️ Thông Tin Bản Mệnh
- **Bản mệnh (ngũ hành nạp âm):** ...
- **Can Chi năm sinh:** ...
- **Cung mệnh:** ...
- **Sao chủ mệnh:** ...

## 📜 Tổng Luận Số Sanh
(3-4 câu khái quát về vận mệnh tổng thể, tính cách, phúc đức)

## 🎯 Số Cầu (12 Cầu)
Liệt kê ngắn gọn 12 cầu (Tài, Quan, Ấn, Phúc, Thọ, Lộc, Mã, Khốc, Hư, Hình, Kiếp, Sát) - mỗi cầu 1 dòng, đánh giá kiết/hung.

## 🌸 Vận Trình Tam Thế
- **Tiền vận (0-30 tuổi):** ...
- **Trung vận (30-50 tuổi):** ...
- **Hậu vận (50+):** ...

## 💼 Sự Nghiệp & Tài Lộc
(2-3 câu)

## ❤️ Tình Duyên Gia Đạo
(2-3 câu)

## 🌿 Lời Khuyên
(2 câu lời khuyên thiết thực)

Lưu ý: Luận giải mang tính tham khảo dưới góc nhìn văn hoá, không đoán định tuyệt đối.`;

    const { text } = await generateText({ model, prompt });
    return { ok: true as const, content: text };
  });

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

const cungSchema = z.object({ cung: z.string().min(1) });

export const luanCungHoangDao = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => cungSchema.parse(d))
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
