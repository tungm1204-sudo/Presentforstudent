# 📚 TÀI LIỆU BÀN GIAO & HƯỚNG DẪN QUAY VIDEO DEMO ĐỒ ÁN

Tài liệu này được soạn thảo chi tiết nhất có thể để bạn (người nhận bàn giao) có thể tự mình Setup, Chạy thử (Test) và Quay Video Demo báo cáo Đồ án môn Blockchain mà không gặp bất kỳ lỗi nào.

---

## PHẦN 1: TỔNG QUAN VỀ HỆ THỐNG
Hệ thống **Student Achievement and Reward System** (Ghi nhận thành tích và Trao thưởng sinh viên) bao gồm 3 phần chính:
1.  **Smart Contract (Solidity):** Quản lý Token ERT (ERC-20). Đã được Deploy lên mạng Sepolia Testnet. Có chức năng cấp phát (Mint) và đổi quà (Burn/Redeem).
2.  **Backend (Node.js/Express):** Đóng vai trò lưu trữ cơ sở dữ liệu Off-chain dưới dạng các file `.json` (Lịch sử nộp đơn, lịch sử đổi quà) và lắng nghe sự kiện từ Blockchain.
3.  **Frontend (React/Vite):** Giao diện người dùng Web3 hiện đại (Light Theme, Animations). Gồm 2 phân hệ: **Staff** (Giảng viên) và **Student** (Sinh viên).

---

## PHẦN 2: CHUẨN BỊ TRƯỚC KHI QUAY VIDEO (SETUP VÀ TEST)

Để chạy hệ thống trên máy của bạn, hãy làm đúng thứ tự sau:

### 1. Cài đặt Ví MetaMask và Hiểu về Phân Quyền (Roles)
- Hệ thống này **BẮT BUỘC** phải có ví MetaMask cài trên trình duyệt.
- **Tạo 2 tài khoản (Account) trong cùng 1 ví MetaMask:**
    - **Account 1 (Người tạo mạng / Deploy Contract):** Tài khoản nào dùng để chạy lệnh Deploy Smart Contract sẽ tự động được hệ thống cấp quyền làm **Giảng viên (Staff / Owner)**.
    - **Account 2, 3... (Người dùng khác):** Tất cả các tài khoản khác khi kết nối vào web sẽ mặc định là **Sinh viên (Student)**.
- **Lưu ý:** Khi gói code gửi cho người khác, nếu họ tự Deploy lại Contract bằng ví của họ, ví đó của họ sẽ tự động trở thành Giảng Viên. Nếu họ xài chung Contract cũ của bạn, thì bạn là Giảng Viên, họ là Sinh Viên.
- **Chuyển mạng sang Sepolia:** Mở MetaMask > Bật "Show test networks" > Chọn **Sepolia**.
- **Xin ETH Testnet:** Xin Sepolia ETH trên trang [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) để trả phí Gas.

### 2. Khởi động Backend (Server)
1.  Mở thư mục code đồ án bằng **VS Code**.
2.  Mở Terminal (Ctrl + \`), chuyển vào thư mục `backend`:
    ```bash
    cd backend
    ```
3.  Chạy lệnh khởi động:
    ```bash
    node server.js
    ```
    *(Nếu thấy báo `Backend server is running on http://localhost:5000` là thành công).*

### 3. Khởi động Frontend (Trang Web)
1.  Mở một Terminal mới trong VS Code (Bấm dấu +).
2.  Chuyển vào thư mục `frontend`:
    ```bash
    cd frontend
    ```
3.  Chạy lệnh khởi động:
    ```bash
    npm run dev
    ```
4.  Giữ phím `Ctrl` và click vào link `http://localhost:5173/` để mở web trên trình duyệt.

> [!WARNING]
> **Lưu ý Cực Kỳ Quan Trọng:** Khi bạn muốn đổi vai trò để test, bạn **PHẢI** mở MetaMask lên, đổi tài khoản, sau đó tải lại trang (F5). Hệ thống sẽ tự động quét ví và đẩy bạn vào đúng trang Staff hoặc Student.

---

## PHẦN 3: KỊCH BẢN QUAY VIDEO DEMO NỘP BÁO CÁO

Đây là kịch bản hoàn hảo nhất để phô diễn luồng logic (Sinh viên nộp đơn -> Giảng viên chuyển tiền -> Sinh viên mua đồ).

### 🎬 Cảnh 1: Sinh viên nộp đơn xin xét duyệt (Submit Request)
1. **Hành động đầu tiên:** Mở MetaMask, **CHỌN ACCOUNT 2 (Sinh viên)**.
2. Trên trang chủ (Landing Page), bấm nút **Connect Wallet**. Hệ thống nhận diện đây là sinh viên và tự động chuyển vào **Student Dashboard**.
3. Giải thích trong video: *"Hệ thống có tính năng phân quyền (Role-based Auth). Do ví này là ví sinh viên, em tự động được chuyển vào Cổng Sinh Viên."*
4. Cuộn xuống điền form **Khai Báo Thành Tích (Submit Achievement Proof)**.
5. Bấm nút **Submit for Review**.
6. Đơn vừa nộp sẽ hiện ra ở cột bên cạnh với chữ nhấp nháy **Pending Review**.

### 🎬 Cảnh 2: Giảng viên kiểm tra và Phát thưởng (Approve & Mint)
1. **Hành động quan trọng:** Mở MetaMask, **ĐỔI SANG ACCOUNT 1 (Giảng viên)**.
2. Giải thích trong video: *"Hệ thống được lập trình để bảo mật tối đa. Ngay khi phát hiện người dùng đổi ví, hệ thống sẽ tự động Đăng Xuất (Auto-Logout) để bảo vệ dữ liệu."*
3. Bấm nút **Connect Wallet** lại bằng ví Giảng viên. Hệ thống tự động chuyển hướng vào Cổng Giảng Viên (Staff Portal).
4. Nhập số lượng Token vào ô Amount ở đơn của sinh viên: Gõ `0.01`.
5. Bấm nút **Approve & Mint (Duyệt & Cấp Thưởng)**.
6. MetaMask sẽ bật lên, bấm **Confirm (Xác nhận)**. Đợi vài giây để Blockchain xử lý.
7. Khi thành công, đơn đó sẽ biến mất (vì đã duyệt xong).

### 🎬 Cảnh 3: Sinh viên nhận tiền và Đi siêu thị đổi quà (Redeem Store)
1. **Hành động quan trọng:** Mở MetaMask, **ĐỔI LẠI SANG ACCOUNT 2 (Sinh viên)**. Hệ thống lại tự động Đăng Xuất. Bấm **Connect Wallet** để vào lại Cổng Sinh Viên.
2. Giải thích trong video: *"Sinh viên vào kiểm tra lại, số dư đã nảy lên 0.01 ERT. Đơn cũ đã đổi thành ISSUED màu xanh. Sinh viên này cũng đã được vinh danh trên Bảng Xếp Hạng (Leaderboard)."*
3. Cuộn xuống phần **Reward Store (Cửa hàng Đổi quà)**.
4. Bấm nút **Redeem Now** ở món quà "University T-Shirt" (Giá 0.005 ERT).
5. MetaMask bật lên, bấm **Confirm**.
6. Đợi giao dịch xác nhận xong. Giải thích trong video: *"Token của sinh viên đã bị đốt (Burn) đi 0.005 ERT để đổi lấy áo"*.
7. Số dư tự động tụt xuống còn **0.005 ERT**.
8. *(Kết thúc video)*.

---

## PHẦN 4: HƯỚNG DẪN VIẾT BÁO CÁO (WORD/PDF)
Bạn có thể copy các ý sau để đưa vào báo cáo môn học:

**1. Kiến trúc hệ thống:** 
- Hệ thống thiết kế theo kiến trúc phi tập trung một phần (Hybrid DApp). 
- Dữ liệu nặng (Mô tả thành tích, tên quà tặng) được lưu Off-chain thông qua Node.js để tiết kiệm phí Gas.
- Dữ liệu cốt lõi (Số dư Token, Phát thưởng, Trừ tiền) được đưa hoàn toàn On-chain qua Smart Contract.

**2. Tokenomics (Vòng đời Token):**
- **Minting (Đúc tiền):** Khi Giảng viên (Staff) duyệt đơn, hàm `issueReward` sẽ gọi `_mint()` để tạo ra Token mới đẩy vào ví Sinh viên.
- **Burning (Đốt tiền):** Khi Sinh viên mua quà, hàm `redeemTokens` sẽ gọi `_burn()` để tiêu hủy lượng Token đó, tránh lạm phát và khép kín vòng đời Token.

**3. Bảo mật (Security):**
- Áp dụng `Ownable` và `modifier onlyStaff` của OpenZeppelin để đảm bảo chỉ những người có thẩm quyền (Giảng viên) mới được phép gọi hàm đúc tiền. Sinh viên không thể tự đúc tiền cho bản thân.

---

## PHẦN 5: HƯỚNG DẪN DEPLOY LÊN RENDER (THAY THẾ INFINITYFREE)

Render là nền tảng vượt trội hơn hẳn InfinityFree, hỗ trợ cực tốt cho cả Backend Node.js và Frontend React, tự động cập nhật khi bạn đẩy code lên GitHub.

**Lưu ý quan trọng về Blockchain:** Bạn **KHÔNG** cần deploy Blockchain lên Render. Smart Contract của bạn đã được deploy vĩnh viễn lên mạng lưới **Ethereum Sepolia** (địa chỉ `0x44A3875B9BC...`). Render chỉ đóng vai trò làm máy chủ lưu trữ Giao diện Web (FE) và Cơ sở dữ liệu Off-chain (BE).

### Bước 1: Deploy Backend (Web Service)
1. Đăng nhập [Render.com](https://render.com), chọn **New > Web Service**.
2. Kết nối với repo GitHub chứa code đồ án của bạn.
3. Trong phần cấu hình:
   - **Root Directory:** Gõ `backend`
   - **Environment:** Chọn `Node`
   - **Build Command:** Gõ `npm install`
   - **Start Command:** Gõ `node server.js`
4. Ấn **Create Web Service**. Đợi Render chạy xong, bạn sẽ có URL của backend (VD: `https://presentforstudent.onrender.com`).

### Bước 2: Deploy Frontend (Static Site)
1. Chọn **New > Static Site** trên Render.
2. Vẫn kết nối với chính repo GitHub đồ án đó.
3. Trong phần cấu hình:
   - **Root Directory:** Gõ `frontend`
   - **Build Command:** Gõ `npm install && npm run build`
   - **Publish Directory:** Gõ `dist` (Quan trọng: Phải là `dist` vì Vite build ra thư mục này).
4. Ấn **Create Static Site**. Đợi vài phút, bạn sẽ có đường link Website xịn xò không dính quảng cáo như InfinityFree!

*Chúc bạn quay video thành công và đạt điểm A+!*
