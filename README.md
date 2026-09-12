# Notion Dashboard Webapp

Webapp Next.js hiển thị dữ liệu của **một database Notion** dưới nhiều kiểu view khác nhau
(Bảng / Kanban / Lịch), tương tự các view bạn đã tạo trong Notion — public, ai có link cũng xem
được không cần đăng nhập. Người có tài khoản (Tên + mã PIN, quản lý ở trang Admin riêng) có thể
đăng nhập để **sửa mọi trường và thêm video mới** trực tiếp từ webapp — tất cả không tốn suất
"guest" của gói Notion Free.

## Vì sao dùng cách này thay vì mời cộng tác viên vào Notion?

Notion Free giới hạn số **block** khi có từ 2 người trở lên trong workspace. Thay vào đó, app
này dùng một **Notion Internal Integration** — về bản chất là một API key chỉ đọc dữ liệu, hoàn
toàn tách biệt với danh sách thành viên/guest của workspace, nên **không** ảnh hưởng tới giới hạn
block của gói Free.

Dữ liệu được server của Vercel gọi Notion API rồi render ra HTML — người xem chỉ thấy trang web,
không bao giờ thấy API key.

## 1. Tạo Notion Integration

1. Vào https://www.notion.so/my-integrations → **New integration**.
2. Đặt tên (vd: `Dashboard Reader`), chọn đúng workspace chứa database cần track.
3. Ở tab **Capabilities**, tick cả 3: **Read content**, **Insert content**, **Update content**
   (2 cái sau bắt buộc để tính năng sửa/thêm video hoạt động).
4. Sau khi tạo, copy **Internal Integration Secret** (dạng `ntn_...` hoặc `secret_...`).

## 2. Share database với integration

Làm bước này cho **cả 2 database**:

1. Database chính (vd "Video Production Tracker"): mở → **...** (góc trên phải) → **Connections**
   → chọn integration vừa tạo.
2. Database "🔐 Web Dashboard Users" (chứa tài khoản đăng nhập webapp): làm tương tự.

Đây là bước bắt buộc — nếu không share, integration sẽ không đọc/ghi được dữ liệu (403/401).

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
# rồi điền đủ 4 biến vào .env.local (xem bước 5 để biết cách lấy từng giá trị)
npm install
npm run dev
```

Mở http://localhost:3000.

## 5. Deploy lên Vercel

1. Push repo này lên GitHub (đã có sẵn nếu bạn nhận repo từ Claude Code).
2. Vào https://vercel.com/new → **Import Git Repository** → chọn repo này.
3. Ở bước cấu hình, thêm 4 **Environment Variables**:
   - `NOTION_TOKEN` = Internal Integration Secret ở bước 1
   - `NOTION_DATABASE_ID` = Database ID của database chính ở bước 3
   - `NOTION_USERS_DATABASE_ID` = Database ID của database "🔐 Web Dashboard Users"
   - `SESSION_SECRET` = một chuỗi ngẫu nhiên bất kỳ, dùng để ký cookie đăng nhập. Tạo bằng:
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Bấm **Deploy**. Sau khi xong bạn sẽ có một link dạng `https://<project>.vercel.app` — public,
   ai có link cũng xem được, không cần đăng nhập.

Vercel free tier là đủ cho nhu cầu này.

## Các view có trong app

- **Bảng**: toàn bộ record dạng table, có ô tìm kiếm theo tiêu đề và filter theo từng cột
  select/multi-select/status.
- **Kanban**: nhóm theo bất kỳ cột select / status / multi-select / person / checkbox nào
  (chọn ở dropdown "Nhóm theo"), giống các board view "Theo Status", "Theo Người phụ trách"...
  trong Notion.
- **Lịch**: hiển thị theo bất kỳ cột ngày tháng nào (vd: Deadline), có thẻ "Chưa có ngày" cho
  các mục chưa set deadline.
- **Thống kê**: biểu đồ donut + thanh phần trăm theo bất kỳ cột select/status nào (mặc định
  Status), giúp nhìn nhanh tiến độ và tỷ lệ từng hạng mục.

Dưới màn hình tablet, Bảng tự chuyển sang dạng thẻ xếp dọc thay vì bảng cuộn ngang, để không bị
mất cột nào khi xem trên điện thoại.

Mỗi lần có người mở trang, server sẽ gọi Notion API lấy dữ liệu mới nhất (không cache), hoặc
bấm nút **Làm mới** để tải lại ngay.

## Đăng nhập, chỉnh sửa và quản lý tài khoản

Trang chính vẫn public — ai có link cũng xem được, không cần đăng nhập. Muốn **sửa dữ liệu hoặc
thêm video mới**, cần đăng nhập bằng Tên + mã PIN ở trang `/login`.

- Tài khoản đăng nhập được lưu trong database Notion phụ **"🔐 Web Dashboard Users"** (đã tạo sẵn
  cùng lúc với repo này), hoàn toàn tách biệt với danh sách thành viên workspace Notion — không
  ảnh hưởng tới giới hạn của gói Free.
- Mọi thao tác ghi vào Notion (sửa/thêm) đều đi qua **cùng một** integration token phía server;
  Notion chỉ thấy integration đó thực hiện thay đổi, không phân biệt người dùng webapp nào.
- Đã có sẵn 1 tài khoản Admin khởi tạo: **Tên `Admin`, PIN `1234`** — hãy đăng nhập rồi vào
  **"Quản lý tài khoản"** để đổi PIN này ngay, hoặc sửa trực tiếp trong database Notion
  "🔐 Web Dashboard Users".
- Trang **Quản lý tài khoản** (`/admin/users`, chỉ Admin truy cập được) cho phép thêm/sửa/xoá tài
  khoản, đổi vai trò Admin/Editor, bật/tắt Active — không cần sửa code hay redeploy.
- Ở Bảng, khi đã đăng nhập, bấm vào 1 ô để sửa (chọn giá trị có sẵn hoặc gõ giá trị mới cho các
  cột dạng select), bấm **+ Thêm video** để tạo mục mới.
- Ở Kanban, khi nhóm theo cột select/status, có thể **kéo-thả thẻ sang cột khác** để đổi giá trị
  đó (vd kéo sang cột "Hoàn thành" để đổi Status).
- **Nhập hàng loạt từ Excel**: nút "Nhập từ Excel" cạnh "+ Thêm video" cho phép tải lên 1 file
  .xlsx để tạo nhiều video cùng lúc thay vì thêm thủ công từng cái. Bấm "Tải file mẫu" để lấy
  đúng định dạng cột (khớp tên các cột trong database), điền dữ liệu rồi tải lên — app sẽ hiện
  bản xem trước, cảnh báo giá trị nào không khớp (vd tên người không có trong workspace), trước
  khi tạo thật trên Notion. Việc đọc file diễn ra ngay trong trình duyệt, không gửi file lên
  server; giới hạn 300 dòng/lần.

## Thêm database khác / nhiều database

Bản hiện tại hiển thị 1 database (theo `NOTION_DATABASE_ID`). Muốn thêm database khác, có thể
nhân bản `app/page.tsx` thành route riêng (vd: `app/[database]/page.tsx`) và truyền ID tương ứng.

## Cấu trúc project

```
app/                    Next.js App Router pages + API routes
components/             UI components (client-side)
lib/notion.ts           Gọi Notion API (đọc + ghi) + transform dữ liệu
lib/users.ts            Đọc/ghi database "Web Dashboard Users"
lib/session.ts, auth.ts Ký/xác thực cookie đăng nhập
lib/group.ts            Logic nhóm dữ liệu cho Kanban view
lib/colors.ts           Map màu Notion sang Tailwind classes
```
