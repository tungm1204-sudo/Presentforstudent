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

### 1. Cài đặt Ví MetaMask
- Hệ thống này **BẮT BUỘC** phải có ví MetaMask cài trên trình duyệt (Chrome/Edge/Brave).
- **Tạo 2 tài khoản (Account) trong cùng 1 ví:**
    -   **Account 1:** Đóng vai trò là **Giảng viên (Staff)**.
    -   **Account 2:** Đóng vai trò là **Sinh viên (Student)**.
- **Chuyển mạng sang Sepolia:** Mở MetaMask > Bấm vào góc trái trên cùng (chỗ chọn mạng) > Bật "Show test networks" > Chọn **Sepolia**.
- **Xin ETH Testnet:** Cả 2 Account đều cần một ít Sepolia ETH để trả phí Gas. Lấy ví của từng Account lên trang [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) để nhận ETH miễn phí.

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
> **Lưu ý Cực Kỳ Quan Trọng:** Khi bạn muốn đóng vai ai, bạn **PHẢI** mở MetaMask lên và đổi tài khoản (Account 1 hoặc 2) cho đúng trước khi thao tác trên web. Web tự động nhận diện tài khoản bạn đang chọn trên MetaMask.

---

## PHẦN 3: KỊCH BẢN QUAY VIDEO DEMO NỘP BÁO CÁO

Đây là kịch bản hoàn hảo nhất để phô diễn toàn bộ luồng logic (Sinh viên nộp đơn -> Giảng viên chuyển tiền -> Sinh viên mua đồ).

### 🎬 Cảnh 1: Sinh viên nộp đơn xin xét duyệt (Submit Request)
1.  **Hành động đầu tiên:** Mở MetaMask, **CHỌN ACCOUNT 2 (Sinh viên)**.
2.  Trên trang web, chuyển sang thẻ **"Student Dashboard"**.
3.  Giải thích trong video: *"Đây là màn hình của sinh viên, hiện tại số dư là 0 ERT, chưa có đơn nào được nộp."*
4.  Điền form **Submit Achievement Proof**:
    -   *Achievement Title:* "Top 1 Hackathon 2026"
    -   *Description:* "Link minh chứng giải thưởng: github.com/..."
5.  Bấm nút **Submit for Review**.
6.  Chỉ vào phần "My Requests History", đơn vừa nộp sẽ hiện ra với chữ nhấp nháy **PENDING REVIEW** (Đang chờ duyệt).

### 🎬 Cảnh 2: Giảng viên kiểm tra và Phát thưởng (Approve & Mint)
1.  **Hành động quan trọng:** Mở MetaMask, **ĐỔI SANG ACCOUNT 1 (Giảng viên)**.
2.  Trên trang web, chuyển sang thẻ **"Staff Dashboard"**.
3.  Giải thích trong video: *"Bây giờ em đổi vai sang Giảng viên. Hệ thống tự nhận diện và hiển thị Đơn xin duyệt của sinh viên lúc nãy."*
4.  Nhập số lượng Token vào ô Amount: Gõ `100`.
5.  Bấm nút **Approve & Mint**.
6.  MetaMask sẽ bật lên yêu cầu xác nhận. Bấm **Confirm (Xác nhận)**.
7.  Đợi vài giây để Blockchain xử lý (Lúc này giải thích: *"Giao dịch đang được đưa lên chuỗi khối Sepolia"*).
8.  Khi thành công, có thông báo báo xanh và đơn đó sẽ **biến mất** khỏi màn hình Staff (vì đã duyệt xong).

### 🎬 Cảnh 3: Sinh viên nhận tiền và Đi siêu thị đổi quà (Redeem Store)
1.  **Hành động quan trọng:** Mở MetaMask, **ĐỔI LẠI SANG ACCOUNT 2 (Sinh viên)**.
2.  Trên trang web, chuyển lại sang thẻ **"Student Dashboard"**.
3.  Giải thích trong video: *"Sinh viên vào kiểm tra lại, số dư đã nhảy lên 100 ERT. Trạng thái đơn cũ đã đổi thành ISSUED màu xanh."*
4.  Cuộn xuống phần **Reward Store (Cửa hàng Đổi quà)**.
5.  Bấm nút **Redeem Now** ở món quà "University T-Shirt" (Giá 50 ERT).
6.  MetaMask bật lên, bấm **Confirm**.
7.  Đợi giao dịch xác nhận xong. Giải thích trong video: *"Token của sinh viên đã bị đốt (Burn) đi 50 ERT để đổi lấy áo"*.
8.  Chỉ vào số dư: Số dư tự động tụt xuống còn **50 ERT**.
9.  *(Kết thúc video)*.

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

*Chúc bạn quay video thành công và đạt điểm A+!*
