## Mục tiêu
Xây app web xem tử vi tiếng Việt, lấy cảm hứng từ diencamtamthe.com: tông màu be-vàng cổ điển, điểm nhấn tím-vàng gradient, hoa đào, hoạ tiết Á Đông. Có 5 trang chính + đăng nhập/đăng ký, có lập lá số tử vi với luận giải bằng AI.

## Các trang sẽ tạo

```
src/routes/
  __root.tsx           Header + Footer dùng chung, nền hoạ tiết
  index.tsx            Trang Tử Vi: form lập lá số + kết quả luận giải
  van-menh.tsx         Vận mệnh năm/tháng theo tuổi (12 con giáp)
  hoang-dao.tsx        12 cung hoàng đạo phương Tây
  lich-am.tsx          Lịch âm tra cứu, đổi dương ↔ âm
  ngay-tot.tsx         Tra cứu ngày tốt theo việc (cưới hỏi, khai trương, xuất hành...)
  login.tsx            Đăng nhập
  signup.tsx           Đăng ký
```

## Tính năng từng trang

**Trang chủ — Tử Vi (`/`)**
- Form: Họ tên, Giới tính (Nam/Nữ), Loại lịch (Dương/Âm), Ngày-Tháng-Năm sinh, Giờ sinh (12 giờ Tý-Hợi).
- Nút "Lập lá số tử vi" → gọi AI luận giải, trả về:
  - Thông tin cơ bản: bản mệnh, ngũ hành, can chi năm/tháng/ngày/giờ
  - Tổng luận số sanh
  - 12 Cầu (số cầu)
  - Coi con nít mới sanh mạng gì (nếu năm sinh < 5 năm trước)
- Khu vực "Luận giải chuyên sâu" (lock 🔒) để định hướng tương lai bán gói premium.

**Vận mệnh (`/van-menh`)**
- Chọn tuổi (12 con giáp) + năm cần xem → AI sinh nội dung vận mệnh tổng quan, tài lộc, tình duyên, sức khoẻ, công việc.

**Hoàng đạo (`/hoang-dao`)**
- 12 cung (Bạch Dương → Song Ngư) dạng grid card; click vào cung → trang chi tiết tử vi tuần/ngày của cung đó (AI sinh).

**Lịch Âm (`/lich-am`)**
- Lịch tháng dạng grid; mỗi ô hiển thị ngày dương + ngày âm, can chi, tốt/xấu.
- Form đổi nhanh Dương ↔ Âm.

**Ngày tốt (`/ngay-tot`)**
- Chọn loại việc (cưới hỏi, khai trương, động thổ, xuất hành, nhập trạch...) + khoảng thời gian → liệt kê các ngày tốt với lý do (AI + thuật toán can chi cơ bản).

**Auth**
- Đăng nhập/đăng ký bằng email + mật khẩu (Lovable Cloud), không cần profiles table.
- Header hiển thị nút "Đăng nhập / Đăng ký" khi chưa login, avatar + Đăng xuất khi đã login.

## Backend (Lovable Cloud)
Bật Lovable Cloud để có:
- **Auth** email/password
- **Server function** `lapLaSo` gọi Lovable AI Gateway (model `google/gemini-2.5-flash`) với prompt tiếng Việt theo phương pháp Diễn Cầm Tam Thế để sinh luận giải có cấu trúc.
- **Server function** `vanMenh`, `ngayTot`, `cungHoangDao` cho các trang còn lại — đều qua AI Gateway.
- **Thư viện hỗ trợ**: `lunar-javascript` (npm) để chuyển đổi dương ↔ âm và lấy can-chi chính xác (chạy được trong Worker, không cần native).

## Design system

**Tokens (`src/styles.css`, oklch)**
- `--background`: be ngà ấm (~ oklch(0.97 0.02 80))
- `--foreground`: nâu đậm (~ oklch(0.25 0.04 60))
- `--primary`: tím hoàng gia (~ oklch(0.45 0.18 295))
- `--accent`: vàng hoàng kim (~ oklch(0.78 0.16 75))
- `--card`: kem nhạt với bo viền vàng mờ
- `--gradient-primary`: linear-gradient tím → vàng (cho nút CTA chính, badge)
- `--shadow-elegant`: shadow vàng mờ
- Font: heading **Cormorant Garamond** (cổ điển), body **Be Vietnam Pro** (tiếng Việt mượt). Nạp qua Google Fonts trong `__root.tsx` head.

**Hoạ tiết & ảnh nền**
- Sinh 2-3 ảnh bằng imagegen:
  - Hero background: phong cảnh núi mây kiểu thuỷ mặc, cành hoa đào, tông be vàng nhạt (mờ, ở 2 bên).
  - Texture giấy cổ + hoa văn la bàn tử vi mờ làm nền section.
  - Lọ gốm + hoa đào ở góc các trang.
- Icons: `lucide-react` + emoji can chi khi cần.

**UI components (shadcn)**
Card, Button, Input, Select, RadioGroup, Tabs, Dialog, Toast, Popover, Calendar.

**Layout**
- Header sticky, nền be trong suốt blur, logo "✨ Diễn Cẩm Tam Thế" bên trái, nav giữa, auth bên phải.
- Footer đơn giản với liên kết, copyright.

## Thứ tự thực hiện
1. Bật Lovable Cloud.
2. Cập nhật design tokens + nạp font + tạo ảnh nền.
3. Tạo Header/Footer trong `__root.tsx`.
4. Trang `/` (Tử Vi) với form + UI kết quả (mock trước).
5. Server function `lapLaSo` gọi AI Gateway, nối vào trang Tử Vi.
6. Các trang Vận mệnh, Hoàng đạo, Lịch âm, Ngày tốt (UI + server fn AI).
7. Auth: trang login/signup + cập nhật header.
8. SEO `head()` riêng cho mỗi route.
9. QA responsive (1341px hiện tại + mobile).

## Ngoài phạm vi (lần này)
- Vẽ thiên bàn 12 cung đầy đủ chính xác như tử vi Tử Bình (rất phức tạp) — sẽ làm phiên bản tóm tắt do AI luận giải.
- Thanh toán gói premium (chỉ hiển thị khoá 🔒 để chừa chỗ).
- Lưu lịch sử lá số của user (có thể thêm sau khi auth ổn).
