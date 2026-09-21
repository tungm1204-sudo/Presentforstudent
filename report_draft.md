# Báo Cáo Đồ Án Cuối Kỳ: Hệ thống Ghi nhận và Trao thưởng cho Sinh viên (Student Achievement and Reward System)

## I. Mở Đầu (Introduction)

### 1. Tổng quan về đề tài được chọn
Hệ thống Khen thưởng và Ghi nhận Thành tích Sinh viên (Student Achievement and Reward System) là một ứng dụng phi tập trung (DApp) nhằm mục đích số hóa toàn bộ quy trình ghi nhận thành tích và trao thưởng trong môi trường đại học. 

Khác với các hệ thống truyền thống, ứng dụng áp dụng quy trình **tương tác hai chiều**: Sinh viên nộp đơn khai báo thành tích kèm minh chứng, Giảng viên xét duyệt và tiến hành đúc (Mint) token thưởng (EduRewardToken - ERT) trực tiếp vào ví MetaMask của sinh viên. Số token này không chỉ để lưu trữ mà còn có thể được Sinh viên sử dụng để **đổi lấy các phần quà thực tế** (Burn/Redeem Token) tại cửa hàng phần thưởng của trường. Việc sử dụng công nghệ Blockchain đảm bảo quá trình cấp phát - tiêu thụ token diễn ra minh bạch, an toàn và không thể bị làm giả.

### 2. Thành viên nhóm và phân công công việc
*(Sinh viên tự điền thông tin nhóm và phân công)*
- Thành viên 1: ... (Thiết kế Smart Contract, Viết Báo cáo)
- Thành viên 2: ... (Phát triển Backend, API, Xử lý dữ liệu Off-chain)
- Thành viên 3: ... (Phát triển UI/UX Frontend, Tích hợp Web3)

### 3. Giới thiệu về công cụ và công nghệ sử dụng
- **Smart Contract:** Solidity, Hardhat, OpenZeppelin (Tiêu chuẩn ERC-20, Ownable).
- **Mạng Blockchain:** Ethereum Sepolia Testnet.
- **Backend:** Node.js, Express.js (Xử lý API và quản lý dữ liệu JSON off-chain để giảm phí Gas).
- **Frontend:** React (Vite), TailwindCSS (Giao diện Glassmorphism), Ethers.js, MetaMask.

---

## II. Thiết kế và Phát triển Hệ thống (System Design and Development)

### 2.1. Mô tả luồng nghiệp vụ cốt lõi (Core Business Flow)
Hệ thống xoay quanh vòng đời hoàn chỉnh của Token (Tokenomics) bao gồm Tạo ra (Mint) và Tiêu hủy (Burn):

1. **Giai đoạn 1: Nộp đơn xin duyệt (Submit Request) - Off-chain**
   - Sinh viên đăng nhập bằng ví MetaMask, điền thông tin thành tích (Tên, Link minh chứng).
   - Dữ liệu được gửi lên Backend và lưu trữ với trạng thái `Pending Review`.
   
2. **Giai đoạn 2: Xét duyệt và Cấp phát (Approve & Mint) - On-chain**
   - Giảng viên (Staff) đăng nhập ví, kiểm tra danh sách đơn đang chờ duyệt.
   - Nhập số lượng ERT thưởng và bấm "Approve & Mint".
   - Smart Contract thực thi hàm `issueReward()`, gọi `_mint()` để đúc lượng ERT tương ứng vào ví sinh viên. Sự kiện `RewardIssued` được phát ra.
   - Backend lắng nghe sự kiện, tự động đổi trạng thái đơn thành `Issued`.

3. **Giai đoạn 3: Đổi quà (Redeem Store) - On-chain**
   - Sinh viên dùng số ERT trong ví để chọn mua các món quà (Ví dụ: Áo trường, Điểm rèn luyện).
   - Smart Contract thực thi hàm `redeemTokens()`, gọi `_burn()` để tiêu hủy (đốt) số lượng ERT sinh viên dùng để mua quà.
   - Tránh lạm phát token và hoàn tất vòng đời của tài sản số.

### 2.2. Thiết kế Hợp đồng Thông minh (Smart Contract Architecture)
Hợp đồng `AchievementReward.sol` được kế thừa từ tiêu chuẩn `ERC20` và `Ownable` của thư viện OpenZeppelin:
- **Phân quyền bảo mật:** Sử dụng mapping `isAuthorizedStaff` và modifier `onlyStaff` để đảm bảo chỉ giảng viên được cấp quyền mới có thể đúc token.
- **Hàm `issueReward`:** Kiểm tra điều kiện ví nhận (không được là địa chỉ `0x0`), đúc token và phát ra sự kiện `RewardIssued`.
- **Hàm `redeemTokens`:** Kiểm tra số dư của sinh viên, tiến hành đốt (`_burn`) token và phát ra sự kiện `TokensRedeemed`.

### 2.3. Thiết kế Frontend (UI/UX)
- Giao diện được thiết kế theo xu hướng **Modern Light Theme** với các thẻ trắng, đổ bóng nổi bật, tối ưu hóa hiển thị (High-contrast).
- Tích hợp `Ethers.js v6` để giao tiếp với ví MetaMask. Quản lý trạng thái bằng React Hooks (`useState`, `useEffect`).
- Có khả năng xử lý mượt mà các lỗi từ chối giao dịch (User Rejected Transaction) từ ví MetaMask, mang lại trải nghiệm người dùng thân thiện.

---

## III. Thử nghiệm và Triển khai (Testing and Deployment)

### 3.1. Triển khai Smart Contract
- Smart Contract đã được biên dịch thành công thông qua Hardhat.
- Triển khai lên mạng **Sepolia Testnet** bằng công cụ Hardhat Ignition (`npx hardhat ignition deploy`).
- Lấy địa chỉ Contract (Contract Address) và cấu hình vào tệp biến môi trường `.env` của Backend và Frontend.

### 3.2. Quá trình kiểm thử (End-to-End Testing)
- **Kiểm thử kết nối ví:** Đã xác thực Frontend có thể nhận diện khi người dùng chuyển đổi tài khoản (Account) trên MetaMask giữa ví Staff và ví Student.
- **Kiểm thử cấp phát (Mint):** Staff duyệt đơn, giao dịch thành công trên Sepolia, số dư của Student tăng chính xác. Backend bắt thành công sự kiện.
- **Kiểm thử đổi thưởng (Burn):** Student thực hiện đổi voucher, nếu số dư không đủ sẽ bị từ chối. Nếu đủ, giao dịch trừ token (burn) thành công trên chuỗi khối.

---

## IV. Kết Luận (Conclusion)

### 4.1. Kết quả đạt được
Nhóm đã hoàn thành xuất sắc đồ án, xây dựng thành công một DApp hoàn chỉnh với kiến trúc Hybrid (kết hợp lưu trữ Off-chain và xử lý On-chain). Điểm nhấn của đồ án là việc xây dựng được **vòng đời Token khép kín (Tokenomics: Mint & Burn)** kết hợp với giao diện UI/UX hiện đại, đem lại giá trị thực tiễn cao cho quy trình số hóa giáo dục đại học.

### 4.2. Hướng phát triển tương lai
- Phát hành song song NFT (ERC-721) dạng "Huy hiệu vinh danh" cho các thành tích đặc biệt xuất sắc (Thủ khoa, Giải Nhất Quốc Gia).
- Tích hợp mạng IPFS để lưu trữ các hình ảnh minh chứng/giấy khen một cách phi tập trung, thay vì chỉ lưu link URL.
