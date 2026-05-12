import { z } from "zod";

export const laSoSchema = z.object({
  hoTen: z.string().min(1).max(80),
  gioiTinh: z.enum(["nam", "nu"]),
  loaiLich: z.enum(["duong", "am"]),
  ngay: z.number().int().min(1).max(31),
  thang: z.number().int().min(1).max(12),
  nam: z.number().int().min(1900).max(2100),
  gio: z.number().int().min(0).max(11),
});

const cungSchema = z.object({
  ten: z.string(),
  saoChinh: z.string(),
  luanGiai: z.string(),
});

const ketQuaSchema = z.object({
  thongTinCoBan: z.object({
    hoTen: z.string(),
    gioiTinh: z.string(),
    ngayDuong: z.string(),
    ngayAm: z.string(),
    gioSinh: z.string(),
    banMenh: z.string(),
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

export type LaSoInput = z.infer<typeof laSoSchema>;
export type KetQuaLaSo = z.infer<typeof ketQuaSchema>;

const GIO_LABEL = [
  "Tý (23-1h)", "Sửu (1-3h)", "Dần (3-5h)", "Mão (5-7h)",
  "Thìn (7-9h)", "Tỵ (9-11h)", "Ngọ (11-13h)", "Mùi (13-15h)",
  "Thân (15-17h)", "Dậu (17-19h)", "Tuất (19-21h)", "Hợi (21-23h)",
];

const TEN_12_CUNG = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch",
  "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách",
  "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
];

const TEN_12_CAU = ["Tài", "Quan", "Ấn", "Phúc", "Thọ", "Lộc", "Mã", "Khốc", "Hư", "Hình", "Kiếp", "Sát"];
const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
const CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
const MENH_NAP_AM = ["Hải Trung Kim", "Lư Trung Hỏa", "Đại Lâm Mộc", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Sơn Đầu Hỏa", "Giản Hạ Thủy", "Thành Đầu Thổ", "Bạch Lạp Kim", "Dương Liễu Mộc", "Tuyền Trung Thủy", "Ốc Thượng Thổ"];

function canChiNam(nam: number) {
  return `${CAN[nam % 10]} ${CHI[nam % 12]}`;
}

export function fallbackKetQua(data: LaSoInput): KetQuaLaSo {
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