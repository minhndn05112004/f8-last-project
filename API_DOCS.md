# 🥩 Anthony Meat Shop — API Documentation

> **Base URL (Development):** `http://localhost:5000`  
> **Base URL (Production):** `https://api.ngodinhnhatminh.name.vn` (hoặc Railway/Render URL)  
> **API Version:** v2.0.0  
> **Encoding:** UTF-8 / JSON

---

## 📋 Mục Lục

1. [Quy Ước Chung](#quy-ước-chung)
2. [Xác Thực (Authentication)](#1-xác-thực-authentication)
3. [Sản Phẩm (Products)](#2-sản-phẩm-products)
4. [Tags](#3-tags)
5. [Giỏ Hàng (Cart)](#4-giỏ-hàng-cart)
6. [Đơn Hàng (Orders)](#5-đơn-hàng-orders)
7. [Tin Tức (News)](#6-tin-tức-news)
8. [Bình Luận (Comments)](#7-bình-luận-comments)
9. [Thanh Toán (Payment)](#8-thanh-toán-payment)
10. [Hỗ Trợ (Support Chat)](#9-hỗ-trợ-support-chat)
11. [Admin](#10-admin)
12. [Health Check](#11-health-check)
13. [WebSocket Events](#12-websocket-events)

---

## 📐 Quy Ước Chung

### Request Headers

| Header | Bắt buộc | Mô tả |
|--------|----------|-------|
| `Content-Type` | Có (POST/PUT) | `application/json` hoặc `multipart/form-data` |
| `Authorization` | Tùy route | `Bearer <access_token>` |

### Response Format

**Thành công:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Mô tả kết quả"
}
```

**Phân trang:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Lỗi:**
```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Request không hợp lệ |
| 401 | Chưa xác thực / Token hết hạn |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 409 | Conflict (VD: email đã tồn tại) |
| 500 | Lỗi server |

### Ký Hiệu Phân Quyền

| Ký hiệu | Ý nghĩa |
|---------|---------|
| 🔓 Public | Không cần đăng nhập |
| 🔑 Auth | Cần đăng nhập (bất kỳ role nào) |
| 👨‍💼 Staff | Cần role STAFF hoặc ADMIN |
| 🚚 Shipper | Cần role SHIPPER hoặc ADMIN |
| 👑 Admin | Chỉ ADMIN |

---

## 1. Xác Thực (Authentication)

**Base path:** `/api/auth`

---

### POST `/api/auth/register` 🔓

**Mục đích:** Đăng ký tài khoản người dùng mới. Gửi email xác minh sau khi đăng ký thành công.

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "matkhau123",
  "phone": "0912345678",       // tuỳ chọn
  "address": "123 Đường ABC"   // tuỳ chọn
}
```

**Validation:**
- `fullName`: tối thiểu 2 ký tự
- `email`: đúng định dạng email
- `password`: tối thiểu 6 ký tự

**Response 201:**
```json
{
  "success": true,
  "data": null,
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Lưu ý:** Tài khoản chưa xác minh sẽ không thể đăng nhập.

---

### GET `/api/auth/verify-email` 🔓

**Mục đích:** Xác minh email qua link được gửi trong email đăng ký.

**Query Params:**
| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `token` | Có | Token xác minh (UUID) |

**Kết quả:** Redirect đến frontend
- Thành công: `/login?verified=true`
- Token không hợp lệ: `/login?error=invalid_token`
- Token hết hạn: `/login?error=token_expired`

---

### POST `/api/auth/resend-verification` 🔓

**Mục đích:** Gửi lại email xác minh cho tài khoản chưa được kích hoạt.

**Request Body:**
```json
{
  "email": "nguyenvana@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "Verification email resent successfully"
}
```

---

### POST `/api/auth/login` 🔓

**Mục đích:** Đăng nhập bằng email (hoặc username nếu là nhân viên) và mật khẩu.

**Request Body:**
```json
{
  "email": "nguyenvana@example.com",   // hoặc username nhân viên
  "password": "matkhau123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "fullName": "Nguyễn Văn A",
      "email": "nguyenvana@example.com",
      "phone": "0912345678",
      "avatar": null,
      "address": "123 Đường ABC",
      "role": "USER",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

**Lỗi phổ biến:**
- 401: Email/mật khẩu sai
- 403: Tài khoản bị vô hiệu hóa hoặc chưa xác minh email

---

### POST `/api/auth/refresh` 🔓

**Mục đích:** Lấy Access Token mới từ Refresh Token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Token refreshed"
}
```

---

### POST `/api/auth/logout` 🔓

**Mục đích:** Đăng xuất, hủy Refresh Token trong database.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

### GET `/api/auth/me` 🔑

**Mục đích:** Lấy thông tin người dùng hiện tại.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@example.com",
    "phone": "0912345678",
    "avatar": "https://res.cloudinary.com/...",
    "address": "123 Đường ABC",
    "role": "USER",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### PUT `/api/auth/profile` 🔑

**Mục đích:** Cập nhật hồ sơ cá nhân (fullName, phone, address, avatar).

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `fullName` | string | Họ và tên |
| `phone` | string | Số điện thoại |
| `address` | string | Địa chỉ |
| `avatar` | file (image) | Ảnh đại diện (upload Cloudinary) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Tên Mới",
    "email": "nguyenvana@example.com",
    "phone": "0987654321",
    "avatar": "https://res.cloudinary.com/...",
    "address": "456 Đường XYZ",
    "role": "USER"
  },
  "message": "Profile updated successfully"
}
```

---

## 2. Sản Phẩm (Products)

**Base path:** `/api/products`

---

### GET `/api/products` 🔓

**Mục đích:** Lấy danh sách sản phẩm đã xuất bản (có phân trang, tìm kiếm, lọc).

**Query Params:**
| Param | Mặc định | Mô tả |
|-------|----------|-------|
| `page` | 1 | Trang hiện tại |
| `limit` | 12 | Số sản phẩm mỗi trang (tối đa 50) |
| `tagSlug` | - | Lọc theo slug của tag |
| `search` | - | Tìm kiếm theo tên hoặc tên tag |
| `minPrice` | - | Giá tối thiểu |
| `maxPrice` | - | Giá tối đa |
| `sortBy` | `createdAt` | Sắp xếp: `createdAt`, `price`, `name`, `stock` |
| `sortOrder` | `desc` | Thứ tự: `asc` hoặc `desc` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Thịt bò Wagyu",
      "slug": "thit-bo-wagyu",
      "description": "...",
      "shortDescription": "Thịt bò Wagyu nhập khẩu",
      "thumbnail": "https://res.cloudinary.com/...",
      "images": ["https://res.cloudinary.com/..."],
      "price": 500000,
      "salePrice": 450000,
      "stock": 100,
      "sku": "WAGYU-001",
      "isPublished": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "tags": [{ "id": 1, "name": "Thịt bò", "slug": "thit-bo" }],
      "createdBy": { "id": 2, "fullName": "Nhân Viên A", "avatar": null }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### GET `/api/products/related` 🔓

**Mục đích:** Lấy sản phẩm liên quan theo tag slugs.

**Query Params:**
| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `tagSlugs` | Có | Danh sách tag slug cách nhau bởi dấu phẩy |
| `excludeId` | Không | ID sản phẩm cần loại trừ |
| `limit` | 4 | Số sản phẩm trả về |

**Response 200:** Danh sách sản phẩm (không phân trang)

---

### GET `/api/products/slug/:slug` 🔓

**Mục đích:** Lấy chi tiết sản phẩm theo slug URL.

**Response 200:** Thông tin sản phẩm đầy đủ (bao gồm tags, createdBy)

---

### GET `/api/products/:id` 🔓

**Mục đích:** Lấy chi tiết sản phẩm theo ID (dùng cho dashboard).

**Response 200:** Thông tin sản phẩm đầy đủ

---

### GET `/api/products/all` 👨‍💼

**Mục đích:** Lấy tất cả sản phẩm (kể cả chưa xuất bản) cho Staff/Admin quản lý.

**Query Params:**
| Param | Mặc định | Mô tả |
|-------|----------|-------|
| `page` | 1 | Trang |
| `limit` | 20 | Số lượng (tối đa 100) |
| `search` | - | Tìm theo tên hoặc SKU |

---

### POST `/api/products` 👨‍💼

**Mục đích:** Tạo sản phẩm mới.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `name` | string | Có | Tên sản phẩm (tối thiểu 2 ký tự) |
| `description` | string | Không | Mô tả đầy đủ |
| `shortDescription` | string | Không | Mô tả ngắn |
| `price` | number | Có | Giá gốc (> 0) |
| `salePrice` | number | Không | Giá khuyến mãi |
| `stock` | number | Không | Tồn kho (mặc định 0) |
| `sku` | string | Không | Mã SKU (unique) |
| `isPublished` | boolean | Không | Trạng thái xuất bản |
| `tagIds` | JSON array | Không | Mảng ID tag: `[1, 2, 3]` |
| `thumbnail` | file | Không | Ảnh thumbnail (max 1 ảnh) |
| `images` | file[] | Không | Ảnh gallery (max 8 ảnh) |

**Response 201:** Sản phẩm vừa tạo

---

### PUT `/api/products/:id` 👨‍💼

**Mục đích:** Cập nhật thông tin sản phẩm.

**Content-Type:** `multipart/form-data`

**Form Fields:** Tương tự POST (tất cả đều không bắt buộc — partial update)

**Response 200:** Sản phẩm sau khi cập nhật

---

### PATCH `/api/products/:id/publish` 👨‍💼

**Mục đích:** Bật/tắt trạng thái xuất bản sản phẩm (toggle).

**Response 200:**
```json
{
  "success": true,
  "data": { "isPublished": true },
  "message": "Product published"
}
```

---

### DELETE `/api/products/:id` 👨‍💼

**Mục đích:** Xóa mềm sản phẩm (soft delete — đặt `isDeleted: true`).

**Response 200:**
```json
{
  "success": true,
  "data": null,
  "message": "Product deleted successfully"
}
```

---

## 3. Tags

**Base path:** `/api/tags`

---

### GET `/api/tags` 🔓

**Mục đích:** Lấy danh sách tất cả tags.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Thịt bò", "slug": "thit-bo" },
    { "id": 2, "name": "Thịt heo", "slug": "thit-heo" }
  ]
}
```

---

### POST `/api/tags` 👨‍💼

**Mục đích:** Tạo tag mới.

**Request Body:**
```json
{
  "name": "Thịt gà"
}
```

**Response 201:** Tag vừa tạo

---

### DELETE `/api/tags/:id` 👑

**Mục đích:** Xóa tag (chỉ Admin).

**Response 200:** Thông báo xóa thành công

---

## 4. Giỏ Hàng (Cart)

**Base path:** `/api/cart`  
**Tất cả routes đều yêu cầu đăng nhập** 🔑

---

### GET `/api/cart` 🔑

**Mục đích:** Lấy giỏ hàng của người dùng hiện tại.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "items": [
      {
        "id": 1,
        "quantity": 2,
        "product": {
          "id": 1,
          "name": "Thịt bò Wagyu",
          "price": 500000,
          "salePrice": 450000,
          "thumbnail": "https://...",
          "stock": 100
        }
      }
    ]
  }
}
```

---

### GET `/api/cart/count` 🔑

**Mục đích:** Lấy tổng số lượng sản phẩm trong giỏ hàng (cho badge trên navbar).

**Response 200:**
```json
{
  "success": true,
  "data": { "count": 3 }
}
```

---

### POST `/api/cart/add` 🔑

**Mục đích:** Thêm sản phẩm vào giỏ hàng.

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Response 200/201:** Giỏ hàng sau khi cập nhật

---

### PUT `/api/cart/item/:id` 🔑

**Mục đích:** Cập nhật số lượng item trong giỏ hàng.

**Params:** `:id` — ID của CartItem

**Request Body:**
```json
{
  "quantity": 5
}
```

**Response 200:** CartItem sau khi cập nhật

---

### DELETE `/api/cart/item/:id` 🔑

**Mục đích:** Xóa một sản phẩm khỏi giỏ hàng.

**Params:** `:id` — ID của CartItem

**Response 200:** Thông báo xóa thành công

---

### DELETE `/api/cart/clear` 🔑

**Mục đích:** Xóa toàn bộ giỏ hàng.

**Response 200:** Thông báo xóa thành công

---

## 5. Đơn Hàng (Orders)

**Base path:** `/api/orders`  
**Tất cả routes đều yêu cầu đăng nhập** 🔑

---

### POST `/api/orders` 🔑

**Mục đích:** Đặt hàng. Có thể đặt từ giỏ hàng hoặc truyền trực tiếp danh sách items.

**Request Body:**
```json
{
  "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM",
  "customerPhone": "0912345678",
  "customerEmail": "customer@example.com",
  "note": "Giao buổi sáng",
  "paymentMethod": "CASH",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

> Nếu bỏ qua `items`, hệ thống sẽ lấy từ giỏ hàng của user.

**Validation:**
- `shippingAddress`: tối thiểu 5 ký tự
- `customerPhone`: tối thiểu 9 ký tự
- `customerEmail`: đúng định dạng email
- `paymentMethod`: `CASH` hoặc `BANK_TRANSFER`

**Xử lý tự động:**
- Kiểm tra tồn kho
- Tính tổng tiền (dùng `salePrice` nếu có)
- Tạo mã đơn hàng: `ORDER_<timestamp>_<random3digits>`
- Trừ tồn kho sản phẩm
- Xóa giỏ hàng (nếu đặt từ cart)
- Ghi audit log trạng thái khởi tạo

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderCode": "ORDER_1700000000000_123",
    "totalAmount": 900000,
    "paymentMethod": "BANK_TRANSFER",
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING_CONFIRMATION",
    "shippingAddress": "123 Đường ABC, Quận 1, TP.HCM",
    "customerPhone": "0912345678",
    "customerEmail": "customer@example.com",
    "orderItems": [...]
  },
  "message": "Đặt hàng thành công"
}
```

---

### GET `/api/orders/my-orders` 🔑

**Mục đích:** Lấy danh sách đơn hàng của người dùng hiện tại.

**Query Params:**
| Param | Mô tả |
|-------|-------|
| `page` | Trang (mặc định 1) |
| `limit` | Số lượng (mặc định 10) |
| `orderStatus` | Lọc theo trạng thái đơn |
| `paymentStatus` | Lọc theo trạng thái thanh toán |

**Response 200:** Danh sách đơn hàng phân trang

---

### GET `/api/orders/stats` 👑

**Mục đích:** Thống kê tổng quan đơn hàng cho Admin dashboard.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pendingConfirmation": 20,
    "confirmed": 10,
    "preparing": 5,
    "readyForDelivery": 8,
    "delivering": 12,
    "delivered": 90,
    "cancelled": 5,
    "totalRevenue": 45000000,
    "todayOrders": 7
  }
}
```

---

### GET `/api/orders/shippers` 👑

**Mục đích:** Lấy danh sách tất cả Shipper đang hoạt động.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "fullName": "Shipper A",
      "phone": "0911111111",
      "email": "shipperA@meatshop.vn",
      "isOnline": true,
      "_count": { "assignedOrders": 3 }
    }
  ]
}
```

---

### GET `/api/orders` 👨‍💼 🚚

**Mục đích:** Lấy tất cả đơn hàng (Admin/Staff xem tất cả; Shipper chỉ xem đơn `READY_FOR_DELIVERY` chưa có shipper).

**Query Params:**
| Param | Mô tả |
|-------|-------|
| `page` | Trang |
| `limit` | Số lượng (mặc định 20) |
| `orderStatus` | Lọc trạng thái đơn |
| `paymentStatus` | Lọc trạng thái thanh toán |
| `userId` | Lọc theo user ID |
| `search` | Tìm theo orderCode, phone, tên khách |

**Response 200:** Danh sách đơn hàng phân trang (kèm thông tin user, shipper, items)

---

### GET `/api/orders/code/:orderCode` 🔑

**Mục đích:** Lấy chi tiết đơn hàng theo mã đơn (USER chỉ xem đơn của mình).

**Response 200:** Chi tiết đơn hàng + items + statusLogs

---

### GET `/api/orders/:orderCode/payment-status` 🔑

**Mục đích:** Kiểm tra trạng thái thanh toán của đơn (dùng polling trên trang chờ thanh toán).

**Response 200:**
```json
{
  "orderCode": "ORDER_1700000000000_123",
  "paymentStatus": "PAID",
  "orderStatus": "PENDING_CONFIRMATION"
}
```

---

### GET `/api/orders/:id` 🔑

**Mục đích:** Lấy chi tiết đơn hàng theo ID (USER chỉ xem đơn của mình).

**Response 200:** Chi tiết đơn hàng đầy đủ bao gồm audit log (`statusLogs`)

---

### PUT `/api/orders/:id/status` 👨‍💼 🚚

**Mục đích:** Cập nhật trạng thái đơn hàng (tuân theo state machine).

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "note": "Đã kiểm tra và xác nhận"
}
```

**Trạng thái hợp lệ:**
- `PENDING_CONFIRMATION` → `CONFIRMED` (ADMIN/STAFF)
- `CONFIRMED` → `PREPARING` (ADMIN/STAFF)
- `PREPARING` → `READY_FOR_DELIVERY` (ADMIN/STAFF)
- `READY_FOR_DELIVERY` → `DELIVERING` (ADMIN/SHIPPER — yêu cầu có shipper)
- `DELIVERING` → `DELIVERED` (SHIPPER)

**Ràng buộc:**
- Shipper chỉ được cập nhật đơn được giao cho mình
- Chuyển sang `DELIVERING` yêu cầu đơn đã có shipper

**Response 200:** Đơn hàng sau khi cập nhật + emit socket realtime

---

### PUT `/api/orders/:id/payment-status` 👨‍💼

**Mục đích:** Cập nhật trạng thái thanh toán thủ công.

**Request Body:**
```json
{
  "status": "PAID"
}
```

**Giá trị hợp lệ:** `PENDING`, `PAID`, `REFUNDED`, `FAILED`

---

### PUT `/api/orders/:id/cancel` 👨‍💼

**Mục đích:** Hủy đơn hàng. Tự động hoàn tồn kho; nếu đã PAID → chuyển `paymentStatus` thành `REFUNDED`.

**Request Body:**
```json
{
  "reason": "Khách không liên lạc được"
}
```

**Trạng thái có thể hủy:**
- `PENDING_CONFIRMATION`: ADMIN/STAFF
- `CONFIRMED`: ADMIN/STAFF
- `PREPARING`: ADMIN
- `READY_FOR_DELIVERY`: ADMIN
- `DELIVERING`: ADMIN

---

### PUT `/api/orders/:id/assign-shipper` 👑

**Mục đích:** Admin phân công Shipper cho đơn hàng.

**Request Body:**
```json
{
  "shipperId": 5
}
```

**Ràng buộc:** Đơn phải ở trạng thái `READY_FOR_DELIVERY` hoặc `DELIVERING`; `shipperId` phải có role SHIPPER.

**Response 200:** Đơn hàng sau khi phân công + emit socket đến shipper

---

### PUT `/api/orders/:id/self-assign` 🚚

**Mục đích:** Shipper tự nhận đơn (race-condition safe dùng `updateMany` với điều kiện `assignedShipperId IS NULL`).

**Ràng buộc:** Đơn phải ở `READY_FOR_DELIVERY` và chưa có shipper.

**Response 200:** Đơn hàng sau khi nhận  
**Response 409:** Đơn đã được shipper khác nhận trước

---

### PUT `/api/orders/:id/shipper-status` 🚚

**Mục đích:** Shipper cập nhật trạng thái giao hàng (dùng chung hàm `updateOrderStatus`).

**Request Body:**
```json
{
  "status": "DELIVERED"
}
```

---

### GET `/api/orders/shipper/my-orders` 🚚

**Mục đích:** Shipper xem danh sách đơn hàng được giao cho mình.

**Query Params:**
| Param | Mô tả |
|-------|-------|
| `page` | Trang |
| `limit` | Số lượng |
| `orderStatus` | Lọc theo trạng thái (có thể nhiều cách nhau dấu phẩy: `DELIVERING,DELIVERED`) |

**Response 200:** Danh sách đơn hàng phân trang

---

## 6. Tin Tức (News)

**Base path:** `/api/news`

---

### GET `/api/news` 🔓

**Mục đích:** Lấy danh sách bài viết đã xuất bản (phân trang, tìm kiếm).

**Query Params:**
| Param | Mặc định | Mô tả |
|-------|----------|-------|
| `page` | 1 | Trang |
| `limit` | 9 | Số bài viết |
| `search` | - | Tìm theo tiêu đề hoặc excerpt |
| `all` | - | Truyền `true` để xem cả bài chưa xuất bản (Staff/Admin) |

**Response 200:** Danh sách bài viết phân trang (kèm `likes`, `dislikes`, `_count`)

---

### GET `/api/news/latest` 🔓

**Mục đích:** Lấy 3 bài viết mới nhất (dùng trên trang chủ).

**Response 200:** Mảng tối đa 3 bài viết

---

### GET `/api/news/:slug` 🔓

**Mục đích:** Lấy chi tiết bài viết theo slug. Tự động tăng lượt xem (`views`).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Cách chọn thịt bò tươi ngon",
    "slug": "cach-chon-thit-bo-tuoi-ngon",
    "content": "...",
    "thumbnail": "https://...",
    "views": 150,
    "likes": 45,
    "dislikes": 3,
    "isPublished": true,
    "createdBy": { "id": 2, "fullName": "Nhân Viên A", "avatar": null }
  }
}
```

---

### POST `/api/news` 👨‍💼

**Mục đích:** Tạo bài viết mới.

**Content-Type:** `multipart/form-data`

**Form Fields:**
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `title` | string | Có | Tiêu đề (tối thiểu 5 ký tự) |
| `content` | string | Có | Nội dung HTML (tối thiểu 10 ký tự) |
| `excerpt` | string | Không | Tóm tắt |
| `isPublished` | boolean | Không | Xuất bản hay không |
| `thumbnail` | file | Không | Ảnh bìa bài viết |

**Response 201:** Bài viết vừa tạo

---

### PUT `/api/news/:id` 👨‍💼

**Mục đích:** Cập nhật bài viết.

**Content-Type:** `multipart/form-data`

**Form Fields:** Tương tự POST (partial update)

**Response 200:** Bài viết sau khi cập nhật

---

### DELETE `/api/news/:id` 👨‍💼

**Mục đích:** Xóa bài viết (xóa cứng, kèm cascade xóa comments và reactions).

**Response 200:** Thông báo xóa thành công

---

### GET `/api/news/:id/comments` 🔓

**Mục đích:** Lấy tất cả bình luận của bài viết.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Bài viết rất hay!",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "user": { "id": 5, "fullName": "Nguyễn A", "avatar": null }
    }
  ]
}
```

---

### POST `/api/news/:id/comments` 🔑

**Mục đích:** Thêm bình luận vào bài viết.

**Request Body:**
```json
{
  "content": "Bình luận của tôi"
}
```

**Validation:** 1–2000 ký tự; tự động strip HTML tags.

**Response 201:** Bình luận vừa tạo

---

### POST `/api/news/:id/react` 🔑

**Mục đích:** Like hoặc Dislike bài viết.

**Logic:**
- Chưa có reaction → tạo mới
- Cùng loại reaction → xóa (toggle off)
- Khác loại → cập nhật

**Request Body:**
```json
{
  "type": "LIKE"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "likes": 46,
    "dislikes": 3,
    "userReaction": "LIKE",
    "action": "added"
  }
}
```

---

### GET `/api/news/:id/my-reaction` 🔑

**Mục đích:** Lấy reaction hiện tại của người dùng đối với bài viết.

**Response 200:**
```json
{
  "success": true,
  "data": { "userReaction": "LIKE" }
}
```

---

## 7. Bình Luận (Comments)

**Base path:** `/api/comments`

---

### DELETE `/api/comments/:id` 🔑

**Mục đích:** Xóa bình luận. Người dùng chỉ xóa được bình luận của mình; ADMIN/STAFF có thể xóa bất kỳ.

**Response 200:** Thông báo xóa thành công

---

## 8. Thanh Toán (Payment)

**Base path:** `/api/payment`

---

### GET `/api/payment/qr/:orderCode` 🔑

**Mục đích:** Tạo thông tin thanh toán và URL mã QR SePay cho đơn hàng.

**Ràng buộc:**
- Chỉ chủ đơn hàng mới được truy cập
- Chỉ áp dụng cho đơn có `paymentMethod: BANK_TRANSFER`

**Response 200 (chưa thanh toán):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "orderCode": "ORDER_1700000000000_123",
    "totalAmount": 900000,
    "paymentStatus": "PENDING",
    "qrUrl": "https://qr.sepay.vn/img?...",
    "bankCode": "MB",
    "accountNumber": "123456789",
    "accountName": "ANTHONY MEAT SHOP",
    "content": "PAY ORDER ORDER_1700000000000_123",
    "alreadyPaid": false
  }
}
```

**Response 200 (đã thanh toán):**
```json
{
  "success": true,
  "data": { "alreadyPaid": true, "qrUrl": null }
}
```

---

### POST `/api/payment/sepay/webhook` 🔓

**Mục đích:** Nhận webhook từ SePay sau khi phát hiện giao dịch ngân hàng đến.

**Xác thực:** Header `Authorization: Apikey <SEPAY_API_TOKEN>`

**Request Body (do SePay gửi):**
```json
{
  "id": "TX_12345",
  "gateway": "MB",
  "transactionDate": "2026-01-01 10:00:00",
  "accountNumber": "123456789",
  "code": "ORDER_1700000000000_123",
  "content": "PAY ORDER ORDER_1700000000000_123",
  "transferType": "in",
  "transferAmount": 900000,
  "accumulated": 5000000,
  "referenceCode": "REF001"
}
```

**Xử lý:**
1. Verify API token
2. Kiểm tra `transferType === "in"`
3. Trích xuất orderCode từ `code` hoặc `content`
4. Kiểm tra idempotency (transactionId)
5. Tìm đơn hàng
6. Cập nhật `paymentStatus → PAID`
7. Ghi `PaymentTransaction`
8. Emit Socket.io đến user + staff

**Response:** Luôn trả `200 { success: true }` để SePay không retry

---

### POST `/api/payment/sepay-webhook` 🔓

**Mục đích:** Webhook phụ từ SePay (handler phức tạp hơn, có nhiều format parsing).

> Tương tự `/api/payment/sepay/webhook` nhưng với logic parse nội dung chuyển khoản nâng cao hơn (hỗ trợ các trường hợp ngân hàng xóa ký tự đặc biệt).

---

## 9. Hỗ Trợ (Support Chat)

**Base path:** `/api/support`  
**Phần lớn tương tác qua Socket.io ở namespace `/chat`**

---

### GET `/api/support/waiting` 👨‍💼

**Mục đích:** Lấy danh sách yêu cầu hỗ trợ đang chờ (status: WAITING).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "WAITING",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "user": {
        "id": 5,
        "fullName": "Khách hàng A",
        "email": "kha@example.com",
        "avatar": null,
        "phone": "0912345678"
      }
    }
  ]
}
```

---

### GET `/api/support/active` 👨‍💼

**Mục đích:** Lấy yêu cầu hỗ trợ đang ACTIVE được gán cho Staff hiện tại.

**Response 200:** Danh sách SupportRequest kèm messages và thông tin user

---

### GET `/api/support/history` 👨‍💼

**Mục đích:** Lấy lịch sử yêu cầu hỗ trợ đã COMPLETED hoặc CLOSED.

**Response 200:** Danh sách SupportRequest với số lượng messages

---

### GET `/api/support/:id/messages` 🔑

**Mục đích:** Lấy toàn bộ tin nhắn của một session hỗ trợ. USER chỉ xem được session của mình.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "messages": [
      {
        "id": 1,
        "content": "Tôi cần hỗ trợ",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "sender": { "id": 5, "fullName": "Khách A", "role": "USER", "avatar": null }
      }
    ]
  }
}
```

---

### POST `/api/support/:id/accept` 👨‍💼

**Mục đích:** Staff tiếp nhận yêu cầu hỗ trợ đang chờ (WAITING → ACTIVE).

**Response 200:** SupportRequest sau khi cập nhật + emit Socket.io

---

### POST `/api/support/:id/complete` 👨‍💼

**Mục đích:** Staff đánh dấu session hỗ trợ hoàn thành (ACTIVE → COMPLETED).

**Response 200:** SupportRequest + emit Socket.io

---

### POST `/api/support/:id/close` 👨‍💼

**Mục đích:** Đóng hẳn session hỗ trợ (→ CLOSED).

**Response 200:** SupportRequest + emit Socket.io

---

## 10. Admin

**Base path:** `/api/admin`  
**Tất cả routes đều yêu cầu role ADMIN** 👑

---

### POST `/api/admin/employees` 👑

**Mục đích:** Tạo tài khoản nhân viên mới (STAFF hoặc SHIPPER).

**Request Body:**
```json
{
  "username": "nhanvien01",
  "password": "matkhau123",
  "fullName": "Nhân Viên 01",
  "role": "STAFF",
  "branch": "Hà Nội"
}
```

**Validation:**
- `username`: 3+ ký tự, chỉ chứa chữ/số/gạch dưới
- `password`: 6+ ký tự
- `role`: `STAFF` hoặc `SHIPPER`
- `branch`: `Hà Nội`, `Đà Nẵng`, hoặc `TP. Hồ Chí Minh`

**Xử lý:** Email tự động tạo: `{username}@meatshop.vn`; tài khoản được đánh dấu verified & active ngay.

**Response 201:** Thông tin nhân viên vừa tạo (không có mật khẩu)

---

### GET `/api/admin/employees` 👑

**Mục đích:** Lấy danh sách tất cả nhân viên (STAFF + SHIPPER).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "fullName": "Nhân Viên A",
      "email": "nhanvien01@meatshop.vn",
      "username": "nhanvien01",
      "role": "STAFF",
      "branch": "Hà Nội",
      "isActive": true,
      "isVerified": true,
      "createdAt": "..."
    }
  ]
}
```

---

### GET `/api/admin/check-cloudinary` 👑

**Mục đích:** Kiểm tra xem cấu hình Cloudinary có hợp lệ không.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "cloud_name": "my-cloud",
    "api_key": "123456789",
    "api_secret_length": 27,
    "api_secret_prefix": "abc12345",
    "status": "credentials_valid"
  },
  "message": "Cloudinary credentials are valid ✅"
}
```

---

## 11. Health Check

---

### GET `/` 🔓

**Mục đích:** Kiểm tra server đang hoạt động và xem danh sách endpoint cơ bản.

**Response 200:**
```json
{
  "success": true,
  "message": "🥩 Anthony Shop API is running",
  "version": "2.0.0",
  "endpoints": [...]
}
```

---

### GET `/api/health` 🔓

**Mục đích:** Health check endpoint (dùng cho load balancer / uptime monitoring).

**Response 200:**
```json
{ "status": "ok" }
```

---

## 12. WebSocket Events

**Server URL:** `ws://localhost:5000` (hoặc production URL)

---

### Namespace: `/` (Root)

Dùng cho thông báo thanh toán và cập nhật đơn hàng.

**Client → Server Events:**

| Event | Payload | Mô tả |
|-------|---------|-------|
| `join_user_room` | `userId: string` | Join phòng riêng của user |
| `join_staff_dashboard` | _(không có)_ | Join phòng dashboard nhân viên |

**Server → Client Events:**

| Event | Room | Payload | Mô tả |
|-------|------|---------|-------|
| `payment_success` | `user_<userId>` | `{ orderCode, paymentStatus: "PAID" }` | Thanh toán thành công |
| `order_updated` | `staff_dashboard` | `{ orderCode, paymentStatus, amount }` | Cập nhật đơn cho staff |
| `order_status_updated` | `user_<userId>`, `staff_dashboard` | `{ orderId, orderCode, orderStatus }` | Thay đổi trạng thái đơn |
| `order_assigned` | `user_<shipperId>` | `{ orderId, orderCode }` | Shipper được phân công đơn mới |

---

### Namespace: `/chat`

Dùng cho hệ thống Live Chat hỗ trợ khách hàng.

**Client → Server Events:**

| Event | Payload | Mô tả |
|-------|---------|-------|
| `authenticate` | `{ userId, role }` | Đăng ký danh tính; STAFF/ADMIN tự join `staff_room` |
| `request_support` | `{ userId, create: true }` | User yêu cầu hỗ trợ |
| `get_pending_requests` | _(không có)_ | Staff lấy danh sách yêu cầu đang chờ |
| `accept_support_request` | `{ requestId, staffId }` | Staff tiếp nhận yêu cầu |
| `send_message` | `{ requestId, senderId, content }` | Gửi tin nhắn |
| `close_support_request` | `{ requestId }` | Đóng session |

**Server → Client Events:**

| Event | Emit to | Payload | Mô tả |
|-------|---------|---------|-------|
| `support_request_status` | socket | `SupportRequest \| null` | Trạng thái yêu cầu hiện tại |
| `pending_requests` | socket | `SupportRequest[]` | Danh sách yêu cầu chờ |
| `new_support_request` | `staff_room` | `SupportRequest` | Yêu cầu mới từ user |
| `support_request_accepted` | `support_<id>` | `SupportRequest` | Staff đã tiếp nhận |
| `support_request_handled` | `staff_room` | `{ requestId }` | Thông báo cho staff khác |
| `receive_message` | `support_<id>` | `Message` | Tin nhắn mới |
| `support_request_closed` | `support_<id>` | `{ requestId, status }` | Session đã đóng |
| `support_request_status_changed` | `staff_room` | `{ requestId, status }` | Thay đổi trạng thái session |
| `error` | socket | `{ message }` | Thông báo lỗi |

---

## 📌 Ghi Chú Quan Trọng

### Cơ Chế Idempotency (Thanh Toán)
SePay có thể gọi webhook nhiều lần cho cùng một giao dịch. Server xử lý idempotency ở 2 cấp:
1. **Cấp giao dịch:** Kiểm tra `transactionId` trong bảng `PaymentTransaction`
2. **Cấp đơn hàng:** Kiểm tra `paymentStatus === "PAID"` trước khi cập nhật

### Token Expiry
- **Access Token:** 15 phút — dùng để gọi API
- **Refresh Token:** 7 ngày — lưu trong DB, dùng để lấy Access Token mới
- Khi Access Token hết hạn → gọi `POST /api/auth/refresh` với Refresh Token

### Soft Delete Sản Phẩm
Sản phẩm bị xóa không bị xóa khỏi DB mà chỉ đặt `isDeleted: true` + `isPublished: false`. Điều này đảm bảo tính toàn vẹn dữ liệu lịch sử đơn hàng.

### Audit Log Đơn Hàng
Mỗi thay đổi trạng thái đơn hàng đều được ghi vào bảng `OrderStatusLog` với thông tin: trạng thái trước/sau, người thực hiện, ghi chú, thời gian.

### Upload Ảnh
- Nếu cấu hình Cloudinary: ảnh được upload thẳng lên Cloudinary, không qua disk
- Nếu chưa cấu hình: ảnh lưu vào thư mục `backend/uploads/` và phục vụ qua `/uploads/*`
