# 🥩 Anthony Meat Shop — Tài Liệu Tổng Quan Dự Án

> **Phiên bản:** 2.0.0  
> **Cập nhật lần cuối:** 2026-06-29  
> **Tác giả:** Ngô Đình Nhật Minh

---

## 📋 Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Kiến Trúc Tổng Thể](#kiến-trúc-tổng-thể)
3. [Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
4. [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
5. [Cơ Sở Dữ Liệu](#cơ-sở-dữ-liệu)
6. [Hệ Thống Phân Quyền](#hệ-thống-phân-quyền)
7. [Tính Năng Chính](#tính-năng-chính)
8. [Luồng Nghiệp Vụ](#luồng-nghiệp-vụ)
9. [Tích Hợp Bên Thứ Ba](#tích-hợp-bên-thứ-ba)
10. [Real-time (Socket.io)](#real-time-socketio)
11. [Giao Diện Frontend](#giao-diện-frontend)
12. [Cài Đặt & Chạy Dự Án](#cài-đặt--chạy-dự-án)
13. [Biến Môi Trường](#biến-môi-trường)
14. [Triển Khai](#triển-khai)

---

## 📖 Giới Thiệu

**Anthony Meat Shop** là một nền tảng thương mại điện tử chuyên bán thịt và thực phẩm tươi sống. Dự án được xây dựng theo mô hình **Full-Stack** với kiến trúc tách biệt Backend (API) và Frontend (SPA).

### Tính năng nổi bật
- 🛒 Hệ thống mua sắm hoàn chỉnh (sản phẩm → giỏ hàng → thanh toán)
- 💳 Thanh toán chuyển khoản ngân hàng tự động qua **SePay**
- 📦 Quản lý đơn hàng theo **state machine** với đầy đủ vòng đời
- 💬 **Live Chat** hỗ trợ khách hàng theo thời gian thực (Socket.io)
- 📰 Hệ thống tin tức / blog có bình luận và react
- 👥 Đa vai trò: Khách hàng, Nhân viên, Shipper, Admin
- 🔐 Xác thực email bắt buộc khi đăng ký
- 📸 Upload ảnh lên **Cloudinary**
- 📡 Thông báo real-time cho thanh toán, trạng thái đơn hàng

---

## 🏗️ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│   React 18 + Vite + TailwindCSS + Socket.io Client         │
│   Deployed: Vercel (https://f8-last-project.vercel.app)    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API Server)                     │
│   Node.js + Express 5 + Socket.io + Prisma ORM             │
│   Deployed: Railway / VPS                                   │
└─────────┬────────────────────────┬───────────────────────── ┘
          │                        │
          ▼                        ▼
┌─────────────────┐    ┌────────────────────────────────────┐
│   MySQL Database│    │        Third-party Services        │
│  (PlanetScale / │    │  • Cloudinary (Image Upload)       │
│   PrismaDB)     │    │  • SePay (Payment Gateway)         │
└─────────────────┘    │  • Resend (Email Service)          │
                       └────────────────────────────────────┘
```

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Node.js | >= 18 | Runtime environment |
| Express | ^5.2.1 | Web framework |
| Prisma | ^6.19.3 | ORM + Database migrations |
| MySQL | 8.x | Cơ sở dữ liệu chính |
| Socket.io | ^4.8.3 | Real-time communication |
| JWT | ^9.0.2 | Xác thực (Access + Refresh token) |
| bcryptjs | ^2.4.3 | Mã hóa mật khẩu |
| Cloudinary | ^1.41.3 | Lưu trữ ảnh |
| Multer | ^1.4.5 | Upload file |
| Nodemailer / Resend | ^8.0.9 / ^6.12.4 | Gửi email |
| Zod | ^3.25.4 | Validation dữ liệu đầu vào |
| Slugify | ^1.6.6 | Tạo slug URL |

### Frontend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| React | ^18.3.1 | UI Framework |
| Vite | ^5.4.10 | Build tool + Dev server |
| React Router DOM | ^6.30.3 | Client-side routing |
| TailwindCSS | ^3.4.19 | CSS utility framework |
| Framer Motion | ^12.38.0 | Animations |
| Socket.io Client | ^4.8.3 | Real-time |
| Axios | ^1.16.1 | HTTP client |
| React Hot Toast | ^2.6.0 | Thông báo toast |
| Lucide React | ^1.16.0 | Icon library |
| Bootstrap | ^5.3.8 | UI components bổ trợ |

---

## 📁 Cấu Trúc Thư Mục

```
f8-last-project/
├── backend/                        # API Server
│   ├── prisma/
│   │   ├── schema.prisma           # Định nghĩa database schema
│   │   ├── seed.js                 # Data mẫu khởi tạo
│   │   └── migrations/             # Migration files
│   ├── src/
│   │   ├── index.js                # Entry point - khởi tạo server + Socket.io
│   │   ├── app.js                  # Express app config + routes registration
│   │   ├── config/
│   │   │   ├── prisma.js           # Prisma client singleton
│   │   │   └── cloudinary.js       # Cloudinary config
│   │   ├── controllers/            # Business logic handlers
│   │   │   ├── authController.js   # Đăng ký, đăng nhập, refresh token
│   │   │   ├── productController.js# CRUD sản phẩm
│   │   │   ├── cartController.js   # Giỏ hàng
│   │   │   ├── orderController.js  # Quản lý đơn hàng (state machine)
│   │   │   ├── newsController.js   # Tin tức + comments + reactions
│   │   │   ├── paymentController.js# QR payment + webhook SePay
│   │   │   ├── adminController.js  # Quản lý nhân viên
│   │   │   ├── categoryController.js# Danh mục
│   │   │   └── tagController.js    # Tags sản phẩm
│   │   ├── routes/                 # Định nghĩa routes
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── news.routes.js
│   │   │   ├── comment.routes.js
│   │   │   ├── support.routes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── sepay.routes.js     # SePay webhook handler
│   │   │   ├── admin.routes.js
│   │   │   ├── tag.routes.js
│   │   │   └── category.routes.js
│   │   ├── middlewares/
│   │   │   ├── auth.js             # JWT authentication + role authorization
│   │   │   ├── upload.js           # Multer + Cloudinary upload config
│   │   │   ├── errorHandler.js     # Global error handler
│   │   │   └── sepayLogger.js      # SePay webhook request logger
│   │   ├── services/
│   │   │   ├── mail.service.js     # Email sending (Resend/Nodemailer)
│   │   │   └── sepayService.js     # SePay integration logic
│   │   ├── sockets/
│   │   │   └── chat.socket.js      # Socket.io chat namespace handler
│   │   └── utils/
│   │       └── response.js         # Standard response helpers
│   ├── uploads/                    # Local upload storage (fallback)
│   ├── .env.example                # Template biến môi trường
│   └── package.json
│
└── frontend/                       # React SPA
    ├── public/                     # Static assets
    ├── src/
    │   ├── main.jsx                # Entry point
    │   ├── App.jsx                 # Router + layout wrapper
    │   ├── index.css               # Global styles
    │   ├── pages/                  # Page components
    │   │   ├── HomePage.jsx        # Trang chủ
    │   │   ├── ProductsPage.jsx    # Danh sách sản phẩm
    │   │   ├── ProductDetailPage.jsx # Chi tiết sản phẩm
    │   │   ├── CartPage.jsx        # Giỏ hàng
    │   │   ├── CheckoutPage.jsx    # Đặt hàng
    │   │   ├── PaymentPage.jsx     # Thanh toán QR
    │   │   ├── OrderSuccessPage.jsx# Thành công
    │   │   ├── OrderTrackingPage.jsx # Theo dõi đơn
    │   │   ├── MyOrdersPage.jsx    # Lịch sử đơn hàng
    │   │   ├── NewsPage.jsx        # Danh sách tin tức
    │   │   ├── NewsDetailPage.jsx  # Chi tiết bài viết
    │   │   ├── AboutPage.jsx       # Giới thiệu
    │   │   ├── LoginPage.jsx       # Đăng nhập
    │   │   ├── RegisterPage.jsx    # Đăng ký
    │   │   ├── AccountPage.jsx     # Hồ sơ cá nhân
    │   │   ├── ChatPage.jsx        # Trang chat
    │   │   ├── admin/
    │   │   │   └── AdminDashboard.jsx  # Dashboard Admin
    │   │   ├── staff/
    │   │   │   ├── StaffDashboard.jsx  # Dashboard nhân viên
    │   │   │   ├── StaffOrderPage.jsx  # Quản lý đơn hàng
    │   │   │   ├── StaffProductPage.jsx# Quản lý sản phẩm
    │   │   │   ├── StaffProductCreatePage.jsx
    │   │   │   └── StaffNewsPage.jsx   # Quản lý tin tức
    │   │   └── shipper/
    │   │       └── ShipperDashboard.jsx# Dashboard shipper
    │   ├── components/
    │   │   ├── layout/             # Navbar, Footer
    │   │   ├── common/             # Scroll to top, shared components
    │   │   ├── auth/               # Protected route guards
    │   │   ├── chat/               # Chat widget
    │   │   └── dashboard/          # Dashboard-specific components
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Global auth state
    │   │   └── CartContext.jsx     # Global cart state
    │   ├── hooks/                  # Custom React hooks
    │   ├── services/               # API call functions
    │   └── utils/                  # Helper functions
    └── package.json
```

---

## 🗃️ Cơ Sở Dữ Liệu

**Database:** MySQL (qua Prisma ORM)

### Sơ Đồ Quan Hệ Thực Thể (ERD)

```
User ─────────────────────────────────────────────────────────────
  │  (role: USER | STAFF | SHIPPER | ADMIN)
  ├──► Order[]           (đơn hàng đặt)
  ├──► Cart?             (1-1, giỏ hàng)
  ├──► Product[]         (sản phẩm tạo)
  ├──► News[]            (bài viết tạo)
  ├──► NewsComment[]     (bình luận)
  ├──► NewsReaction[]    (like/dislike)
  ├──► SupportRequest[]  (yêu cầu hỗ trợ - USER creates)
  ├──► SupportRequest[]  (yêu cầu được gán - STAFF handles)
  ├──► Message[]         (tin nhắn chat)
  ├──► Order[]           (đơn hàng được gán giao - SHIPPER)
  └──► OrderStatusLog[]  (audit log)

Product ──────────────────────────────────────────────────────────
  ├──► ProductTag[]      (N-N qua ProductTagOnProduct)
  ├──► OrderItem[]
  └──► CartItem[]

Order ────────────────────────────────────────────────────────────
  ├──► OrderItem[]
  ├──► PaymentTransaction[]
  └──► OrderStatusLog[]

News ─────────────────────────────────────────────────────────────
  ├──► NewsComment[]
  └──► NewsReaction[]

SupportRequest ───────────────────────────────────────────────────
  └──► Message[]
```

### Các Bảng Chính

| Bảng | Mô tả |
|------|-------|
| `user` | Người dùng với 4 vai trò |
| `product` | Sản phẩm (soft delete) |
| `producttag` | Tag/nhãn sản phẩm |
| `producttagonproduct` | Bảng trung gian N-N sản phẩm-tag |
| `cart` | Giỏ hàng (1-1 với user) |
| `cartitem` | Chi tiết giỏ hàng |
| `order` | Đơn hàng |
| `orderitem` | Chi tiết đơn hàng (snapshot giá) |
| `paymenttransaction` | Lịch sử giao dịch thanh toán |
| `orderstatuslog` | Audit log thay đổi trạng thái đơn |
| `news` | Bài viết / tin tức |
| `newscomment` | Bình luận bài viết |
| `newsreaction` | Like/Dislike bài viết |
| `supportrequest` | Yêu cầu hỗ trợ chat |
| `message` | Tin nhắn trong session hỗ trợ |

### Enums

| Enum | Giá trị |
|------|---------|
| `OrderStatus` | `PENDING_CONFIRMATION` → `CONFIRMED` → `PREPARING` → `READY_FOR_DELIVERY` → `DELIVERING` → `DELIVERED` / `CANCELLED` |
| `PaymentStatus` | `PENDING` / `PAID` / `REFUNDED` / `FAILED` |
| `PaymentMethod` | `CASH` / `BANK_TRANSFER` |
| `SupportStatus` | `WAITING` / `ACTIVE` / `COMPLETED` / `CLOSED` |
| `ReactionType` | `LIKE` / `DISLIKE` |

---

## 🔐 Hệ Thống Phân Quyền

### Vai Trò (Roles)

| Role | Mô tả | Truy cập |
|------|-------|----------|
| `USER` | Khách hàng thông thường | Trang công khai + tính năng mua hàng |
| `STAFF` | Nhân viên | Dashboard quản lý đơn + sản phẩm + tin tức |
| `SHIPPER` | Người giao hàng | Dashboard nhận và cập nhật đơn giao |
| `ADMIN` | Quản trị viên | Toàn quyền + quản lý nhân viên |

### Cơ Chế Xác Thực

1. **JWT Access Token** (15 phút): Gửi trong header `Authorization: Bearer <token>`
2. **Refresh Token** (7 ngày): Lưu trong DB, dùng để lấy Access Token mới
3. **Email Verification**: Bắt buộc sau khi đăng ký (link kích hoạt 24h)

### State Machine Đơn Hàng

```
PENDING_CONFIRMATION
    │ ADMIN/STAFF: confirm
    ▼
CONFIRMED
    │ ADMIN/STAFF: prepare
    ▼
PREPARING
    │ ADMIN/STAFF: mark ready
    ▼
READY_FOR_DELIVERY
    │ SHIPPER: self-assign → ADMIN: assign shipper
    ▼
DELIVERING
    │ SHIPPER: mark delivered
    ▼
DELIVERED (terminal)

Hủy đơn (CANCELLED) có thể từ:
- PENDING_CONFIRMATION: ADMIN/STAFF
- CONFIRMED: ADMIN/STAFF
- PREPARING: ADMIN
- READY_FOR_DELIVERY: ADMIN
- DELIVERING: ADMIN
```

---

## ✨ Tính Năng Chính

### 🛍️ Khách Hàng (USER)
- Duyệt và tìm kiếm sản phẩm (lọc theo tag, giá, từ khóa)
- Xem chi tiết sản phẩm + sản phẩm liên quan
- Thêm/xóa sản phẩm vào giỏ hàng
- Đặt hàng (từ giỏ hàng hoặc trực tiếp)
- Thanh toán tiền mặt (COD) hoặc chuyển khoản QR
- Theo dõi trạng thái đơn hàng real-time
- Xem lịch sử đơn hàng
- Đọc và bình luận bài viết
- Like/Dislike bài viết
- Live Chat hỗ trợ với nhân viên
- Quản lý hồ sơ cá nhân + ảnh đại diện

### 👨‍💼 Nhân Viên (STAFF)
- Dashboard tổng quan
- Quản lý sản phẩm (CRUD + publish/unpublish)
- Quản lý tin tức (CRUD)
- Xem + cập nhật trạng thái đơn hàng
- Chat hỗ trợ khách hàng
- Xem yêu cầu hỗ trợ đang chờ và tiếp nhận

### 🚚 Shipper (SHIPPER)
- Xem danh sách đơn sẵn sàng giao
- Tự nhận đơn (race-condition safe)
- Cập nhật trạng thái: Đang giao → Đã giao
- Xem lịch sử đơn đã giao

### 👑 Admin (ADMIN)
- Toàn bộ quyền của STAFF + SHIPPER
- Dashboard thống kê tổng quan
- Quản lý nhân viên (tạo tài khoản STAFF/SHIPPER)
- Phân công shipper cho đơn hàng
- Hủy đơn ở bất kỳ trạng thái nào
- Xem thống kê đơn hàng và doanh thu
- Kiểm tra kết nối Cloudinary

---

## 🔄 Luồng Nghiệp Vụ

### Luồng Mua Hàng COD
```
User đặt hàng → PENDING_CONFIRMATION
    → Staff xác nhận → CONFIRMED
    → Staff chuẩn bị → PREPARING
    → Staff đánh dấu sẵn sàng → READY_FOR_DELIVERY
    → Shipper nhận đơn → DELIVERING
    → Shipper xác nhận giao → DELIVERED
```

### Luồng Thanh Toán QR (BANK_TRANSFER)
```
User đặt hàng → PENDING_CONFIRMATION (paymentStatus: PENDING)
    → User vào trang PaymentPage
    → Hệ thống tạo QR từ SePay API
    → User quét QR và chuyển khoản
    → SePay gửi webhook về server
    → Server cập nhật paymentStatus: PAID
    → Socket.io thông báo đến trình duyệt user và staff
    → Staff xác nhận đơn → tiếp tục flow như COD
```

### Luồng Live Chat Hỗ Trợ
```
User click chat → socket: request_support
    → Tạo SupportRequest (WAITING)
    → Thông báo đến staff_room
    → Staff thấy yêu cầu → accept_support_request
    → SupportRequest chuyển sang ACTIVE
    → User và Staff trao đổi qua send_message/receive_message
    → Staff đóng → COMPLETED/CLOSED
```

---

## 🔌 Tích Hợp Bên Thứ Ba

### SePay (Cổng Thanh Toán)
- **Mục đích:** Tạo QR chuyển khoản ngân hàng
- **Cơ chế:** SePay giám sát tài khoản ngân hàng; khi nhận tiền → gọi webhook về server
- **Webhook URL:** `POST /api/payment/sepay-webhook`
- **Bảo mật:** Header `Authorization: Apikey <SEPAY_API_TOKEN>`
- **Idempotency:** Kiểm tra `transactionId` trùng lặp trước khi xử lý
- **An toàn:** Luôn trả về HTTP 200 (kể cả lỗi) để SePay không retry

### Cloudinary (Lưu Trữ Ảnh)
- **Mục đích:** Upload và lưu ảnh sản phẩm, thumbnail bài viết, avatar người dùng
- **Tích hợp:** `multer-storage-cloudinary` — upload trực tiếp không qua server disk
- **Fallback:** Nếu chưa cấu hình, ảnh lưu trong thư mục `uploads/` local

### Resend / Nodemailer (Email)
- **Mục đích:** Gửi email xác minh tài khoản sau khi đăng ký
- **Template:** Link xác thực có hiệu lực 24 giờ

---

## 📡 Real-time (Socket.io)

### Namespace: `/` (Root)
| Event | Hướng | Mô tả |
|-------|-------|-------|
| `join_user_room` | Client → Server | Join room `user_<userId>` |
| `join_staff_dashboard` | Client → Server | Join room `staff_dashboard` |
| `payment_success` | Server → Client | Thông báo thanh toán thành công |
| `order_updated` | Server → Client | Thông báo đơn hàng cập nhật (cho staff) |
| `order_status_updated` | Server → Client | Thay đổi trạng thái đơn |
| `order_assigned` | Server → Client | Shipper được phân công đơn |

### Namespace: `/chat`
| Event | Hướng | Mô tả |
|-------|-------|-------|
| `authenticate` | Client → Server | Đăng ký userId + role, join staff_room nếu là STAFF |
| `request_support` | Client → Server | User yêu cầu hỗ trợ (tạo SupportRequest) |
| `get_pending_requests` | Client → Server | Staff lấy danh sách yêu cầu đang chờ |
| `accept_support_request` | Client → Server | Staff tiếp nhận yêu cầu |
| `send_message` | Client → Server | Gửi tin nhắn trong session hỗ trợ |
| `close_support_request` | Client → Server | Staff đóng session |
| `new_support_request` | Server → Client | Thông báo yêu cầu mới đến staff |
| `support_request_status` | Server → Client | Trạng thái hiện tại của SupportRequest |
| `support_request_accepted` | Server → Client | Xác nhận staff đã tiếp nhận |
| `support_request_handled` | Server → Client | Thông báo đến staff_room |
| `receive_message` | Server → Client | Tin nhắn mới đến |
| `support_request_closed` | Server → Client | Session đã đóng |

---

## 🖥️ Giao Diện Frontend

### Route Map

| Đường dẫn | Component | Phân quyền |
|-----------|-----------|------------|
| `/` | HomePage | Public |
| `/products` | ProductsPage | Public |
| `/products/:slug` | ProductDetailPage | Public |
| `/news` | NewsPage | Public |
| `/news/:slug` | NewsDetailPage | Public |
| `/about` | AboutPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/cart` | CartPage | Đăng nhập |
| `/checkout` | CheckoutPage | Đăng nhập |
| `/payment/:orderCode` | PaymentPage | Đăng nhập |
| `/order-success/:orderCode` | OrderSuccessPage | Đăng nhập |
| `/my-orders` | MyOrdersPage | Đăng nhập |
| `/orders/:id` | OrderTrackingPage | Đăng nhập |
| `/account` | AccountPage | Đăng nhập |
| `/staff/dashboard` | StaffDashboard | STAFF / ADMIN |
| `/shipper/dashboard` | ShipperDashboard | SHIPPER / ADMIN |
| `/admin/dashboard` | AdminDashboard | ADMIN |

### State Management
- **AuthContext:** Lưu thông tin user, access token, refresh token sau khi đăng nhập
- **CartContext:** Đồng bộ giỏ hàng từ server, cập nhật số lượng real-time

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu Cầu
- Node.js >= 18
- MySQL 8.x đang chạy
- Tài khoản Cloudinary (tuỳ chọn)
- Tài khoản SePay (tuỳ chọn, cho thanh toán QR)
- Tài khoản Resend (tuỳ chọn, cho gửi email)

### Backend

```bash
cd backend

# Cài đặt dependencies
npm install

# Copy và điền biến môi trường
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn

# Chạy migrations và seed data
npm run setup

# Chạy development server
npm run dev
# → Server chạy tại http://localhost:5000
```

### Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Chỉnh sửa .env với VITE_API_URL trỏ đến backend
# VITE_API_URL=http://localhost:5000

# Chạy development server
npm run dev
# → App chạy tại http://localhost:5173
```

### Scripts Backend

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy với nodemon (hot reload) |
| `npm start` | Chạy production |
| `npm test` | Chạy Jest tests |
| `npm run seed` | Seed data mẫu vào DB |
| `npm run prisma:studio` | Mở Prisma Studio |
| `npm run prisma:migrate` | Chạy migration |

---

## ⚙️ Biến Môi Trường

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/dbname"

# Server
PORT=5000
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx

# SePay
SEPAY_API_KEY=           # API Key để gọi SePay API
SEPAY_API_TOKEN=         # Token để xác thực webhook từ SePay
SEPAY_BANK_CODE=MB       # Mã ngân hàng (VD: MB, VCB, TCB...)
SEPAY_ACCOUNT_NUMBER=    # Số tài khoản ngân hàng
SEPAY_ACCOUNT_NAME=      # Tên tài khoản

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000    # URL của backend API
```

---

## 🌐 Triển Khai

### Frontend — Vercel
- **URL Production:** `https://f8-last-project.vercel.app`
- **URL Custom Domain:** `https://www.ngodinhnhatminh.name.vn`
- Cấu hình `vercel.json` để redirect SPA routes về `index.html`

### Backend
- Hỗ trợ deploy lên Railway, Render, hoặc VPS bất kỳ
- Sử dụng `process.env.PORT` (mặc định 5000)
- Graceful shutdown khi nhận tín hiệu `SIGTERM`

### CORS Được Phép
- `http://localhost:5173`
- `http://localhost:3000`
- `https://f8-last-project.vercel.app`
- `https://*.vercel.app` (preview deployments)
- `https://www.ngodinhnhatminh.name.vn`
- `https://ngodinhnhatminh.name.vn`
