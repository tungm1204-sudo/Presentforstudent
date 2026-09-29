# 🎯 HƯỚNG DẪN TEST ĐỒ ÁN VÀ QUAY VIDEO (Dành cho thành viên làm Báo cáo)

Chào bạn, đây là hướng dẫn chi tiết để bạn có thể tự mình test và quay video toàn bộ kịch bản của Đồ án môn Blockchain ngay trên web mà không cần cài đặt code rườm rà.

---

## BƯỚC 1: TRUY CẬP VÀO HỆ THỐNG
Tất cả đã được đưa lên server, bạn chỉ cần mở link sau trên trình duyệt (Khuyên dùng Chrome/Brave):
👉 **[Truy cập Website Đồ Án](https://presentforstudent-1.onrender.com/)**

---

## BƯỚC 2: THIẾT LẬP VÍ METAMASK ĐỂ ĐÓNG 2 VAI TRÒ
Do hệ thống phân quyền cực kỳ chặt chẽ (Role-based Auth), bạn cần có 2 tài khoản ví khác nhau để đóng 2 vai: **Giảng Viên** và **Sinh Viên**.

### 1. Cài đặt quyền Giảng Viên (Staff/Owner)
Chỉ có người tạo ra Smart Contract mới có quyền duyệt đơn và cấp tiền. 
1. Mở tiện ích ví **MetaMask** của bạn.
2. Bạn hãy bảo bạn của mình (người làm code) gửi cho bạn mã **Private Key (Khóa cá nhân)** của cái ví mà bạn ấy đã dùng.
3. Trong MetaMask, bấm vào nút chọn Tài khoản (ở giữa trên cùng) > Chọn **Add account or hardware wallet** > Chọn **Import account (Nhập tài khoản)**.
4. Dán mã Private Key đó vào. Đặt tên tài khoản này là `Vi Giang Vien`.

### 2. Cài đặt quyền Sinh Viên (Student)
1. Trong MetaMask, bấm lại vào nút chọn Tài khoản > Chọn **Add a new account (Thêm tài khoản mới)**.
2. Đặt tên là `Vi Sinh Vien`. 
3. *Lưu ý:* Bất kỳ ví nào không phải là ví Giảng Viên thì hệ thống sẽ tự động coi là Sinh Viên.

### 3. Lấy phí Gas (Sepolia ETH)
Đảm bảo bạn đang bật mạng **Sepolia** trên MetaMask. Nếu ví `Vi Sinh Vien` chưa có ETH để làm phí giao dịch, hãy bảo bạn code chuyển sang cho một ít, hoặc tự xin tại [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia).

---

## BƯỚC 3: KỊCH BẢN QUAY VIDEO DEMO A-Z

Khi quay video màn hình, hãy thao tác chậm rãi theo đúng trình tự sau để thấy được sự mượt mà của UX/UI:

### 🎬 Cảnh 1: Sinh viên nộp đơn (Đóng vai Sinh Viên)
1. Mở MetaMask, **đảm bảo đang chọn `Vi Sinh Vien`**.
2. Tải lại trang web (F5) > Bấm nút **Connect Wallet**. Hệ thống sẽ nhận diện và đưa bạn vào **Student Dashboard**.
3. (Nếu là lần đầu tiên ví này kết nối, hệ thống sẽ bắt nhập Họ tên và MSSV. Cứ nhập bình thường).
4. Ở mục "Khai Báo Thành Tích", gõ một thành tích ví dụ: *Giải Nhất Sinh viên 5 tốt*.
5. Bấm **Submit for Review**. Một thông báo (Toast) màu xanh góc phải sẽ hiện ra `Request submitted successfully!`.
6. Đơn sẽ hiện ra ở bảng bên cạnh với trạng thái màu vàng **Pending Review**. Kèm theo nút "Hủy đơn này".

### 🎬 Cảnh 2: Giảng viên Duyệt & Phát tiền (Đóng vai Giảng Viên)
1. Mở MetaMask, **chuyển sang tài khoản `Vi Giang Vien`**.
2. *Lưu ý ăn điểm:* Ngay khi bạn đổi ví, hệ thống sẽ phát hiện và **tự động văng (Logout)** ra màn hình chính. Hãy giải thích điều này trong video (Tính năng bảo mật tối đa).
3. Bấm **Connect Wallet** lại. Hệ thống đưa bạn vào **Staff Dashboard**.
4. Bạn sẽ thấy cái đơn mà sinh viên vừa nộp lúc nãy.
5. Gõ số `0.01` vào ô ERT bên cạnh. Bấm **Approve & Mint**.
6. MetaMask hiện lên, bấm **Confirm** và đợi màn hình Loading xoay xong. Tiền đã được chuyển!
7. Kéo xuống dưới cùng, bạn sẽ thấy **Bảng Lịch sử chuyển tiền** đã ghi nhận giao dịch này. Bấm vào nút `Tải file CSV` để biểu diễn tính năng xuất báo cáo cho Giảng viên.

### 🎬 Cảnh 3: Sinh viên Mua đồ (Đóng vai Sinh Viên)
1. Mở MetaMask, **chuyển lại sang `Vi Sinh Vien`**. Hệ thống tự động văng ra ngoài.
2. Bấm **Connect Wallet** lại.
3. Lúc này số dư trên màn hình của Sinh viên đã nhảy lên `0.01 ERT`.
4. Bảng thành tích (Leaderboard) sẽ xuất hiện huy hiệu Vàng 🥇 cho sinh viên này.
5. Kéo xuống phần Cửa hàng (Reward Store). Bấm nút **Redeem Now** ở món quà Áo thun (Giá 0.005 ERT).
6. MetaMask hiện lên, bấm **Confirm**. Chờ vòng xoay Loading xử lý.
7. Đổi quà thành công! Số dư bị trừ đi, chỉ còn `0.005 ERT`. Bảng sao kê Lịch sử Giao dịch bên trên sẽ hiện lên dòng trừ tiền màu đỏ.

***
*Kết thúc video báo cáo.* 🎉
*Toàn bộ dữ liệu được cập nhật tự động lên Giao diện cực kỳ đẹp mắt, không cần tải lại trang. Chúc nhóm đạt điểm tuyệt đối A+!*
