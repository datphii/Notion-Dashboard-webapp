# Notion Dashboard Webapp

Webapp Next.js hiển thị dữ liệu của **một database Notion** dưới nhiều kiểu view khác nhau
(Bảng / Kanban / Lịch), tương tự các view bạn đã tạo trong Notion — nhưng public, không cần
đăng nhập, và không tốn suất "guest" của gói Notion Free.

## Vì sao dùng cách này thay vì mời cộng tác viên vào Notion?

Notion Free giới hạn số **block** khi có từ 2 người trở lên trong workspace. Thay vào đó, app
này dùng một **Notion Internal Integration** — về bản chất là một API key chỉ đọc dữ liệu, hoàn
toàn tách biệt với danh sách thành viên/guest của workspace, nên **không** ảnh hưởng tới giới hạn
block của gói Free.

Dữ liệu được server của Vercel gọi Notion API rồi render ra HTML — người xem chỉ thấy trang web,
không bao giờ thấy API key.

## 1. Tạo Notion Integration

1. Vào https://www.notion.so/my-integrations → **New integration**.
2. Đặt tên (vd: `Dashboard Reader`), chọn đúng workspace chứa database cần track, capability chỉ
   cần **Read content**.
3. Sau khi tạo, copy **Internal Integration Secret** (dạng `ntn_...` hoặc `secret_...`).

## 2. Share database với integration

1. Mở database "Video Production Tracker" (hoặc database bạn muốn hiển thị) trong Notion.
2. Bấm **...** (góc trên phải) → **Connections** → chọn integration vừa tạo ở bước 1.

Đây là bước bắt buộc — nếu không share, integration sẽ không đọc được dữ liệu (403 Unauthorized).

## 3. Lấy Database ID

Mở database ở chế độ full-page, copy URL. Database ID là chuỗi 32 ký tự trước dấu `?`, ví dụ:

```
https://www.notion.so/myworkspace/f45d4efbbd2041449a646e3a41153ef1?v=...
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                   đây là Database ID
```

## 4. Chạy thử ở local

```bash
cp .env.example .env.local
# rồi điền NOTION_TOKEN và NOTION_DATABASE_ID vào .env.local
npm install
npm run dev
```

Mở http://localhost:3000.

## 5. Deploy lên Vercel

1. Push repo này lên GitHub (đã có sẵn nếu bạn nhận repo từ Claude Code).
2. Vào https://vercel.com/new → **Import Git Repository** → chọn repo này.
3. Ở bước cấu hình, thêm 2 **Environment Variables**:
   - `NOTION_TOKEN` = Internal Integration Secret ở bước 1
   - `NOTION_DATABASE_ID` = Database ID ở bước 3
4. Bấm **Deploy**. Sau khi xong bạn sẽ có một link dạng `https://<project>.vercel.app` — public,
   ai có link cũng xem được, không cần đăng nhập.

Vercel free tier là đủ cho nhu cầu này (Next.js server components + revalidate 60s).

## Các view có trong app

- **Bảng**: toàn bộ record dạng table, có ô tìm kiếm theo tiêu đề và filter theo từng cột
  select/multi-select/status.
- **Kanban**: nhóm theo bất kỳ cột select / status / multi-select / person / checkbox nào
  (chọn ở dropdown "Nhóm theo"), giống các board view "Theo Status", "Theo Người phụ trách"...
  trong Notion.
- **Lịch**: hiển thị theo bất kỳ cột ngày tháng nào (vd: Deadline), có thẻ "Chưa có ngày" cho
  các mục chưa set deadline.

Dữ liệu tự làm mới mỗi 60 giây (ISR), hoặc bấm nút **Làm mới** để tải lại ngay.

## Thêm database khác / nhiều database

Bản hiện tại hiển thị 1 database (theo `NOTION_DATABASE_ID`). Muốn thêm database khác, có thể
nhân bản `app/page.tsx` thành route riêng (vd: `app/[database]/page.tsx`) và truyền ID tương ứng.

## Cấu trúc project

```
app/            Next.js App Router pages
components/     UI components (client-side)
lib/notion.ts   Gọi Notion API + transform dữ liệu
lib/group.ts    Logic nhóm dữ liệu cho Kanban view
lib/colors.ts   Map màu Notion sang Tailwind classes
```
