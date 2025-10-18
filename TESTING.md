# 📋 HƯỚNG DẪN CHẠY INTEGRATION TESTS

## Yêu cầu trước khi test

### 1. ✅ Docker Desktop phải chạy
- Mở **Docker Desktop** từ Start Menu
- Chờ Docker khởi động hoàn tất (icon Docker ở system tray không còn loading)

### 2. ✅ Docker containers đang chạy
```powershell
docker-compose up -d
```

### 3. ✅ Dừng các containers sẽ test
Containers phải dừng để test server local có thể bind port:

```powershell
# Để test product:
docker-compose stop product

# Để test auth:
docker-compose stop auth
```

### 4. ✅ MongoDB local phải TẮT và DISABLE (nếu có cài)

**⚠️ QUAN TRỌNG**: MongoDB local service sẽ tự khởi động lại nếu chỉ kill process. Phải disable service!

**Bước 1: Kiểm tra MongoDB local có chạy không**
```powershell
netstat -ano | findstr :27017
```

**Bước 2: Tắt MongoDB service (khuyến nghị)**
- **Cách 1 - PowerShell Administrator**:
  ```powershell
  Stop-Service MongoDB
  Set-Service MongoDB -StartupType Disabled
  ```
- **Cách 2 - Services GUI**:
  - Nhấn Win+R → gõ `services.msc` → Enter
  - Tìm "MongoDB Server (MongoDB)"
  - Right-click → **Stop**
  - Right-click → **Properties** → Startup type: **Disabled** → OK

**Bước 3: Xác nhận MongoDB local đã tắt**
```powershell
netstat -ano | findstr :27017
# Chỉ nên thấy Docker MongoDB (PID từ Docker containers)
```

### 5. ✅ Tạo test user (chỉ cần 1 lần cho product test)

**Lưu ý**: Chỉ cần tạo user này một lần, sau đó có thể test product nhiều lần.

```powershell
Invoke-RestMethod -Uri http://localhost:3000/register -Method Post -ContentType "application/json" -Body '{"username":"testuser","password":"password123"}'
```

**Kết quả mong đợi**:
```json
{
  "_id": "...",
  "username": "testuser",
  ...
}
```

---

## 🧪 TEST 1: PRODUCT SERVICE

### Mục đích
- Test tạo sản phẩm mới
- Test validation (thiếu name, price âm)

### Các bước thực hiện

**Bước 1: Dừng product container**
```powershell
docker-compose stop product
```

**Bước 2: Chạy test**
```powershell
$env:MONGODB_PRODUCT_URI='mongodb://admin:password@localhost:27017/product_db?authSource=admin'
$env:JWT_SECRET='your_super_secret_jwt_key_here_change_in_production'
$env:LOGIN_TEST_USER='testuser'
$env:LOGIN_TEST_PASSWORD='password123'
npx mocha --timeout 20000 product/src/test/product.test.js --exit
```

### Kết quả mong đợi
```
✔ should create a new product
✔ should return an error if name is missing

2 passing (187ms)
```

### Giải thích
- Test sẽ start Product service local trên port 3001
- Login vào Auth service (Docker, port 3000) để lấy JWT token
- Gọi POST `/api/products/` với token để test tạo sản phẩm
- Kết nối MongoDB Docker (với credentials admin/password)

### Lỗi thường gặp

**Lỗi: `EADDRINUSE :::3001`**
- **Nguyên nhân**: Product container vẫn đang chạy
- **Giải pháp**: `docker-compose stop product`

---

## 🔐 TEST 2: AUTH SERVICE

### Mục đích
- Test đăng ký user mới
- Test login và nhận JWT token
- Test validation (username đã tồn tại, sai password)

### Các bước thực hiện

**Bước 1: Dừng auth container**
```powershell
docker-compose stop auth
```

**Bước 2: Chạy test**
```powershell
cd 'E:/Nam4 - Ki 1/Microservice/EProject-Phase-1/auth'
$env:MONGODB_AUTH_URI='mongodb://admin:password@localhost:27017/auth_db?authSource=admin'
$env:JWT_SECRET='auth_super_secret_jwt_key_change_in_production'
npm test
```

### Kết quả mong đợi
```
✔ should register a new user (138ms)
✔ should return an error if the username is already taken
✔ should return a JWT token for a valid user (73ms)
✔ should return an error for an invalid user
✔ should return an error for an incorrect password (70ms)

5 passing (338ms)
```

### Giải thích
- Test sẽ start Auth service local trên port 3000
- Tạo test user `testuser` với password `password`
- Test register, login flows
- Kết nối MongoDB Docker (với credentials)
- Cleanup test users sau khi chạy xong

### Lỗi thường gặp

**Lỗi: "Username already taken" (test fail)**
- **Nguyên nhân**: MongoDB local service đã bật lại
- **Giải pháp**: 
  1. `netstat -ano | findstr :27017` - kiểm tra
  2. Disable MongoDB service (xem Bước 4 ở trên)
  3. Chạy lại test

**Lỗi: `EADDRINUSE :::3000`**
- **Nguyên nhân**: Auth container vẫn đang chạy
- **Giải pháp**: `docker-compose stop auth`

---

## 🔧 SAU KHI TEST XONG

### Start lại các containers
```powershell
# Start lại tất cả
docker-compose start

# Hoặc chỉ start từng service:
docker-compose start product
docker-compose start auth
```

### Verify services đang chạy
```powershell
docker-compose ps
curl http://localhost:3003/health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### 1. JWT_SECRET phải khớp
- **Product test** dùng: `your_super_secret_jwt_key_here_change_in_production`
- **Auth test** dùng: `auth_super_secret_jwt_key_change_in_production`
- **Auth service** sign token với secret trong `.env` của nó
- **Lưu ý**: Khi test product, phải dùng JWT_SECRET giống với auth service để verify token

### 2. MongoDB URI phải có credentials
- **Format**: `mongodb://admin:password@localhost:27017/<db_name>?authSource=admin`
- Không có credentials sẽ lỗi: `"Command requires authentication"`

### 3. Port conflicts
- Nếu test báo `EADDRINUSE`, nghĩa là container service vẫn đang chạy
- **Giải pháp**: `docker-compose stop <service>` trước khi test

### 4. MongoDB local conflicts
- Nếu test báo "Username already taken" nhưng Docker MongoDB trống → MongoDB local đang chạy
- **Giải pháp**: Tắt MongoDB local để test dùng Docker MongoDB

### 5. Dependencies
Đảm bảo đã cài đủ test dependencies:
```powershell
# Cho product test
cd product
npm install

# Cho auth test
cd auth
npm install --save-dev mocha chai chai-http
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot find module 'chai'"
**Nguyên nhân**: Thiếu test dependencies

**Giải pháp**:
```powershell
cd auth
npm install --save-dev mocha chai chai-http
```

### Lỗi: "EADDRINUSE :::3000" hoặc ":::3001"
**Nguyên nhân**: Container service vẫn đang chạy trên port đó

**Giải pháp**:
```powershell
docker-compose stop product  # Nếu test product
docker-compose stop auth     # Nếu test auth
```

### Lỗi: "Command find requires authentication"
**Nguyên nhân**: MongoDB URI thiếu credentials

**Giải pháp**: Đảm bảo URI có format:
```
mongodb://admin:password@localhost:27017/<db_name>?authSource=admin
```

### Lỗi: "jwt malformed" hoặc "invalid token"
**Nguyên nhân**: JWT_SECRET không khớp giữa Auth service và Product test

**Giải pháp**: 
1. Kiểm tra `auth/.env` xem JWT_SECRET là gì
2. Dùng chính xác secret đó trong biến môi trường test

### Lỗi: "Username already taken" (nhưng DB trống)
**Nguyên nhân**: Test đang kết nối MongoDB local thay vì Docker

**Giải pháp**:
1. Kiểm tra: `netstat -ano | findstr :27017`
2. **Nếu thấy nhiều PID**: MongoDB local service đang chạy
3. **Disable MongoDB service**:
   ```powershell
   # PowerShell Administrator
   Stop-Service MongoDB
   Set-Service MongoDB -StartupType Disabled
   ```
4. Xác nhận: `netstat -ano | findstr :27017` (chỉ thấy Docker)
5. Chạy lại test

**Lưu ý**: Chỉ kill process (taskkill) sẽ không đủ vì MongoDB service tự khởi động lại!

### Lỗi: "socket hang up" hoặc "ECONNREFUSED"
**Nguyên nhân**: Service dependencies (Auth, MongoDB, RabbitMQ) không chạy

**Giải pháp**:
```powershell
docker-compose up -d
docker-compose ps  # Verify all running
```

---

## 📊 TỔNG KẾT

| Test File | Tests | Passing | Time |
|-----------|-------|---------|------|
| `product.test.js` | 2 | ✅ 2 | ~187ms |
| `authController.test.js` | 5 | ✅ 5 | ~338ms |
| **TOTAL** | **7** | **✅ 7** | **~525ms** |

---

## 🚀 WORKFLOW HOÀN CHỈNH

### Quy trình test đầy đủ (Copy-Paste):

```powershell
# ===== BƯỚC 1: Start Docker stack =====
docker-compose up -d

# ===== BƯỚC 2: Tắt MongoDB local (nếu có) =====
# Cách 1: PowerShell Administrator
Stop-Service MongoDB
Set-Service MongoDB -StartupType Disabled

# Cách 2: Services GUI (Win+R → services.msc)
# Tìm "MongoDB Server" → Stop → Properties → Startup: Disabled

# ===== BƯỚC 3: Xác nhận MongoDB local đã tắt =====
netstat -ano | findstr :27017
# Chỉ nên thấy Docker containers

# ===== BƯỚC 4: Tạo test user (1 lần) =====
Invoke-RestMethod -Uri http://localhost:3000/register -Method Post -ContentType "application/json" -Body '{"username":"testuser","password":"password123"}'

# ===== BƯỚC 5: Test Product =====
docker-compose stop product
$env:MONGODB_PRODUCT_URI='mongodb://admin:password@localhost:27017/product_db?authSource=admin'
$env:JWT_SECRET='your_super_secret_jwt_key_here_change_in_production'
$env:LOGIN_TEST_USER='testuser'
$env:LOGIN_TEST_PASSWORD='password123'
npx mocha --timeout 20000 product/src/test/product.test.js --exit

# ===== BƯỚC 6: Test Auth =====
docker-compose stop auth
cd auth
$env:MONGODB_AUTH_URI='mongodb://admin:password@localhost:27017/auth_db?authSource=admin'
$env:JWT_SECRET='auth_super_secret_jwt_key_change_in_production'
npm test
cd ..

# ===== BƯỚC 7: Start lại containers =====
docker-compose start

# ===== BƯỚC 8: Verify =====
docker-compose ps
curl http://localhost:3003/health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## 📝 GHI CHÚ

- Tests chạy **integration tests**, không phải unit tests
- Tests cần **real MongoDB** và **RabbitMQ** từ Docker
- Tests tự động **cleanup** data sau khi chạy xong
- Có thể chạy tests nhiều lần mà không ảnh hưởng dữ liệu production (vì dùng test DB riêng)
- **QUAN TRỌNG**: Luôn start lại containers sau khi test xong để hệ thống hoạt động bình thường
