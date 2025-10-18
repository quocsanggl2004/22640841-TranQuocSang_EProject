# EProject Phase 1 - Microservices E-Commerce

Dự án xây dựng hệ thống thương mại điện tử theo kiến trúc microservices với Docker và CI/CD.

---

## 📖 Tổng Quan Dự Án

### Hệ thống giải quyết vấn đề gì?
Xây dựng một nền tảng e-commerce đơn giản với các chức năng:
- Đăng ký và đăng nhập người dùng
- Quản lý sản phẩm (thêm, xem, sửa, xóa)
- Đặt hàng sản phẩm
- Thông báo đơn hàng qua message queue

### Công nghệ sử dụng
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Message Queue:** RabbitMQ
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **API Testing:** Postman

---

## 🏗️ Kiến Trúc Hệ Thống

```
                    ┌─────────────┐
                    │   Client    │
                    │  (Postman)  │
                    └──────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  API Gateway   │  Port 3003
                  │   (Routing)    │
                  └────────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌────────┐        ┌──────────┐       ┌────────┐
   │  Auth  │        │ Product  │       │ Order  │
   │ :3000  │        │  :3001   │       │ :3002  │
   └────┬───┘        └────┬─────┘       └────┬───┘
        │                 │                   │
        └─────────┬───────┴─────────┬─────────┘
                  ▼                 ▼
           ┌──────────┐      ┌──────────┐
           │ MongoDB  │      │ RabbitMQ │
           │  :27017  │      │  :5672   │
           └──────────┘      └──────────┘
```

### Các Services

| Service | Port | Chức năng |
|---------|------|-----------|
| **API Gateway** | 3003 | Nhận requests từ client và route đến service tương ứng |
| **Auth Service** | 3000 | Xử lý đăng ký, đăng nhập, tạo JWT token |
| **Product Service** | 3001 | Quản lý sản phẩm (CRUD) |
| **Order Service** | 3002 | Quản lý đơn hàng, gửi thông báo qua RabbitMQ |
| **MongoDB** | 27017 | Lưu trữ dữ liệu (users, products, orders) |
| **RabbitMQ** | 5672, 15672 | Message queue cho communication giữa services |

### Cách các services giao tiếp
1. **Client → API Gateway:** HTTP requests
2. **API Gateway → Services:** Routing requests đến đúng service
3. **Services → MongoDB:** Lưu/đọc dữ liệu
4. **Order Service → RabbitMQ:** Gửi thông báo khi có đơn hàng mới
5. **Services ↔ Services:** JWT token để authenticate

---

## 🚀 Hướng Dẫn Chạy Dự Án

### Yêu cầu
- Docker Desktop đã cài đặt và đang chạy
- Git đã cài đặt

### Bước 1: Clone dự án
```bash
git clone https://github.com/quocsanggl2004/22640841-TranQuocSang_EProject.git
cd EProject-Phase-1
```

### Bước 2: Chạy Docker Compose
```bash
docker-compose up -d
```

Lệnh này sẽ:
- Tải images (MongoDB, RabbitMQ)
- Build 4 services (API Gateway, Auth, Product, Order)
- Khởi động tất cả containers

### Bước 3: Kiểm tra services đã chạy
```bash
docker-compose ps
```

Kết quả mong đợi: 6 containers với status **Up (healthy)**

### Bước 4: Kiểm tra health
Mở browser và truy cập:
- API Gateway: http://localhost:3003/health
- Auth Service: http://localhost:3000/health
- Product Service: http://localhost:3001/health
- Order Service: http://localhost:3002/health

Tất cả phải trả về JSON: `{ "status": "... is running" }`

---

## 📡 Test API với Postman

### Lưu ý quan trọng
- **Tất cả requests đi qua API Gateway:** `http://localhost:3003`
- **Cần JWT token** cho các API: Products, Orders
- Test theo đúng thứ tự dưới đây

---
### TEST 0: Kiểm tra trạng thái hoạt động các service
-api_gateway: http://localhost:3003/health
![alt text](public/images/1.png)

-auth_service: http://localhost:3000/health
![alt text](public/images/2.png)

-product_service: http://localhost:3001/health
![alt text](public/images/3.png)

-order_service: http://localhost:3002/health
![alt text](public/images/4.png)


### TEST 1: Đăng ký tài khoản

**Nghiệp vụ:** Tạo tài khoản người dùng mới trong hệ thống

**Request:**
```
Method: POST
URL: http://localhost:3003/auth/register
Headers:
  Content-Type: application/json
Body (JSON):
{
  "username": "nguyenvana",
  "password": "matkhau123"
}
```

**Kết quả mong đợi:**
- Status: `200 OK`

![alt text](public/images/5.png)

### TEST 2: Đăng nhập

**Nghiệp vụ:** Đăng nhập với tài khoản đã tạo để lấy JWT token

**Request:**
```
Method: POST
URL: http://localhost:3003/auth/login
Headers:
  Content-Type: application/json
Body (JSON):
{
  "username": "nguyenvana",
  "password": "matkhau123"
}
```

**Kết quả mong đợi:**
- Status: `200 OK`

**⚠️ Quan trọng:** Copy `token` để dùng cho các requests tiếp theo!

![alt text](public/images/6.png)

### TEST 3: Verify Token

**Nghiệp vụ:** Kiểm tra token có hợp lệ không

**Request:**
```
Method: GET
URL: http://localhost:3003/auth/verify
Headers:
  Authorization: Bearer <PASTE_TOKEN_Ở_ĐÂY>
```

**Kết quả mong đợi:**
- Status: `200 OK`

![alt text](public/images/7.png)

### TEST 4: Tạo sản phẩm mới

**Nghiệp vụ:** Thêm sản phẩm vào hệ thống

**Request:**
```
Method: POST
URL: http://localhost:3003/products
Headers:
  Content-Type: application/json
  Authorization: Bearer <TOKEN>
Body (JSON):
{
  "name": "Laptop Dell XPS 15",
  "price": 25000000,
  "description": "Laptop cao cấp cho dân văn phòng"
}
```

**Kết quả mong đợi:**
- Status: `201 Created`
- Response:
```json
{
  "_id": "64a7c9d0abc123456789",
  "name": "Laptop Dell XPS 15",
  "price": 25000000,
  "description": "Laptop cao cấp cho dân văn phòng",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**⚠️ Quan trọng:** Copy `_id` của sản phẩm để dùng cho test tiếp theo!

**📸 Chèn ảnh Postman ở đây:**
![Create Product]()

---

### TEST 5: Xem danh sách sản phẩm

**Nghiệp vụ:** Lấy tất cả sản phẩm trong hệ thống

**Request:**
```
Method: GET
URL: http://localhost:3003/products
Headers:
  Authorization: Bearer <TOKEN>
```

**Kết quả mong đợi:**
- Status: `200 OK`
- Response: Array các sản phẩm
```json
[
  {
    "_id": "64a7c9d0abc123456789",
    "name": "Laptop Dell XPS 15",
    "price": 25000000,
    "description": "Laptop cao cấp cho dân văn phòng",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "_id": "64a7c9d1def987654321",
    "name": "iPhone 15 Pro Max",
    "price": 30000000,
    "description": "Điện thoại cao cấp",
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
]
```

**📸 Chèn ảnh Postman ở đây:**
![Get All Products]()

---

### TEST 6: Xem chi tiết 1 sản phẩm

**Nghiệp vụ:** Lấy thông tin chi tiết của một sản phẩm theo ID

**Request:**
```
Method: GET
URL: http://localhost:3003/products/64a7c9d0abc123456789
Headers:
  Authorization: Bearer <TOKEN>
```

**Lưu ý:** Thay `64a7c9d0abc123456789` bằng `_id` thật từ TEST 4

**Kết quả mong đợi:**
- Status: `200 OK`
- Response:
```json
{
  "_id": "64a7c9d0abc123456789",
  "name": "Laptop Dell XPS 15",
  "price": 25000000,
  "description": "Laptop cao cấp cho dân văn phòng",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**📸 Chèn ảnh Postman ở đây:**
![Get Product By ID]()

---

### TEST 7: Tạo đơn hàng

**Nghiệp vụ:** Đặt hàng sản phẩm, hệ thống sẽ gửi thông báo qua RabbitMQ

**Request:**
```
Method: POST
URL: http://localhost:3003/orders
Headers:
  Content-Type: application/json
  Authorization: Bearer <TOKEN>
Body (JSON):
{
  "productId": "64a7c9d0abc123456789",
  "quantity": 2
}
```

**Lưu ý:** Thay `productId` bằng `_id` thật từ TEST 4

**Kết quả mong đợi:**
- Status: `201 Created`
- Response:
```json
{
  "_id": "64a7d0e1xyz789456123",
  "userId": "507f1f77bcf86cd799439011",
  "productId": "64a7c9d0abc123456789",
  "quantity": 2,
  "status": "pending",
  "createdAt": "2024-01-15T12:00:00.000Z"
}
```

**📸 Chèn ảnh Postman ở đây:**
![Create Order]()

---

### TEST 8: Kiểm tra RabbitMQ nhận message

**Nghiệp vụ:** Verify rằng Order Service đã gửi message vào RabbitMQ khi tạo đơn hàng

**Cách kiểm tra:**
1. Mở browser
2. Truy cập: http://localhost:15672
3. Login với:
   - Username: `guest`
   - Password: `guest`
4. Click tab **Queues**
5. Click vào queue tên **ORDER**
6. Xem phần **Messages** → Phải có ít nhất 1 message

**Kết quả mong đợi:**
- Queue `ORDER` tồn tại
- Có messages trong queue
- Message chứa thông tin đơn hàng (productId, quantity, userId)

**📸 Chèn ảnh RabbitMQ Management UI ở đây:**
![RabbitMQ Queue]()

---

### TEST 9: Xem danh sách đơn hàng

**Nghiệp vụ:** Lấy tất cả đơn hàng của user hiện tại

**Request:**
```
Method: GET
URL: http://localhost:3003/orders
Headers:
  Authorization: Bearer <TOKEN>
```

**Kết quả mong đợi:**
- Status: `200 OK`
- Response: Array các đơn hàng của user
```json
[
  {
    "_id": "64a7d0e1xyz789456123",
    "userId": "507f1f77bcf86cd799439011",
    "productId": "64a7c9d0abc123456789",
    "quantity": 2,
    "status": "pending",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
]
```

**📸 Chèn ảnh Postman ở đây:**
![Get Orders]()

---

## 🔐 Xử Lý Lỗi Thường Gặp

### Lỗi 401 Unauthorized
**Nguyên nhân:** Thiếu hoặc sai JWT token

**Giải pháp:**
1. Đăng nhập lại để lấy token mới (TEST 2)
2. Kiểm tra header `Authorization: Bearer <token>`
3. Đảm bảo có dấu cách giữa `Bearer` và `<token>`

### Lỗi 404 Not Found
**Nguyên nhân:** ID không tồn tại hoặc sai URL

**Giải pháp:**
1. Kiểm tra lại `_id` từ response trước đó
2. Đảm bảo URL đúng: `http://localhost:3003/...`

### Lỗi 400 Bad Request
**Nguyên nhân:** Dữ liệu gửi lên sai format hoặc thiếu field

**Giải pháp:**
1. Kiểm tra Body có đúng JSON format không
2. Kiểm tra các field bắt buộc: `username`, `password`, `name`, `price`, etc.

### Docker containers không start
**Giải pháp:**
```bash
# Stop tất cả
docker-compose down

# Xóa volumes (reset database)
docker-compose down -v

# Start lại
docker-compose up -d
```

---

## 🧪 CI/CD với GitHub Actions

### Workflow tự động
Mỗi khi push code lên GitHub, hệ thống tự động:

1. **Chạy Tests**
   - Auth service: 5 tests
   - Product service: 2 tests
   - **Tổng: 7 tests**

2. **Build Docker Images**
   - Build 4 images: auth, product, order, api-gateway
   - Tag với `latest` và `commit-sha`

3. **Push lên Docker Hub**
   - Repository: https://hub.docker.com/u/quocsanggl2004
   - Images: `eproject-auth`, `eproject-product`, `eproject-order`, `eproject-api-gateway`

### Xem kết quả CI/CD
1. Vào GitHub repository
2. Click tab **Actions**
3. Xem workflow runs

**📸 Chèn ảnh GitHub Actions ở đây:**
![GitHub Actions]()

**📸 Chèn ảnh Docker Hub ở đây:**
![Docker Hub]()

---

## 📂 Cấu Trúc Thư Mục

```
EProject-Phase-1/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions workflow
├── api-gateway/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── auth/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── controllers/
│       ├── models/
│       ├── services/
│       └── test/
├── product/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── test/
├── order/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── models/
│       └── utils/
├── docker-compose.yml         # Docker orchestration
├── README.md                  # File này

```

---

## 🎓 Kiến Thức Đã Áp Dụng

### 1. Microservices Architecture
- Chia hệ thống thành các services độc lập
- Mỗi service có database riêng
- Services giao tiếp qua HTTP và Message Queue

### 2. Design Patterns
- **API Gateway Pattern:** Centralized entry point
- **Repository Pattern:** Tách business logic và data access
- **Message Queue Pattern:** Async communication

### 3. Docker & Containerization
- Mỗi service chạy trong container riêng
- Docker Compose quản lý multi-container
- Container networking và service discovery

### 4. CI/CD
- Automated testing với GitHub Actions
- Automated build và push Docker images
- Continuous integration trên mỗi commit

### 5. Authentication & Security
- JWT (JSON Web Tokens) cho stateless authentication
- Password hashing với bcrypt
- Token-based authorization giữa services

---

## 👨‍💻 Tác Giả

**Tên:** Trần Quốc Sáng  
**MSSV:** 22640841  
**GitHub:** https://github.com/quocsanggl2004/22640841-TranQuocSang_EProject  
**Docker Hub:** https://hub.docker.com/u/quocsanggl2004

---


## 📝 Ghi Chú

- **Database credentials:** 
  - MongoDB username: `admin`
  - MongoDB password: `password`
  
- **RabbitMQ credentials:**
  - Username: `guest`
  - Password: `guest`

- **JWT Secret:** Mỗi service có secret riêng (nên thống nhất trong production)

---


