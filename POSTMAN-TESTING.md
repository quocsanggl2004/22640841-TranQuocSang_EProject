# 🧪 HƯỚNG DẪN TEST POSTMAN CHI TIẾT

## 📋 Mục lục
1. [Setup Postman](#setup-postman)
2. [Test Flow Cơ Bản](#test-flow-cơ-bản)
3. [Test Từng Service](#test-từng-service)
4. [Test RabbitMQ](#test-rabbitmq)
5. [Test Scenarios](#test-scenarios)

---

## 🔧 Setup Postman

### 1. Tạo Environment Variables

Trong Postman, tạo Environment mới tên **"EProject Local"** với các biến:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3003` | `http://localhost:3003` |
| `authUrl` | `http://localhost:3000` | `http://localhost:3000` |
| `productUrl` | `http://localhost:3001` | `http://localhost:3001` |
| `orderUrl` | `http://localhost:3002` | `http://localhost:3002` |
| `token` | (để trống) | (để trống) |

### 2. Tạo Collection

Tạo Collection mới tên **"EProject Microservices"**

---

## 🚀 Test Flow Cơ Bản

### STEP 1: Register User

**Request:**
```http
POST {{baseUrl}}/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "_id": "67f33e43b66586d9333ea9d7",
  "username": "testuser"
}
```

**Test Script (Postman Tests tab):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has user ID", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData).to.have.property('username');
});
```

---

### STEP 2: Login

**Request:**
```http
POST {{baseUrl}}/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjMzZTQzYjY2NTg2ZDkzMzNlYTlkNyIsImlhdCI6MTc2MDc3MTY5Nn0..."
}
```

**Test Script (Lưu token vào environment):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    
    // Lưu token vào environment variable
    pm.environment.set("token", jsonData.token);
});
```

---

### STEP 3: Verify Token (Dashboard)

**Request:**
```http
GET {{baseUrl}}/dashboard
Authorization: Bearer {{token}}
```

**Expected Response (200 OK):**
```json
{
  "message": "Welcome to your dashboard!",
  "user": {
    "id": "67f33e43b66586d9333ea9d7",
    "iat": 1760771696
  }
}
```

---

### STEP 4: Create Product

**Request:**
```http
POST {{baseUrl}}/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "iPhone 15 Pro",
  "price": 999,
  "description": "Latest iPhone with A17 chip"
}
```

**Expected Response (201 Created):**
```json
{
  "_id": "67f340a1c77586d9333ea9d8",
  "name": "iPhone 15 Pro",
  "price": 999,
  "description": "Latest iPhone with A17 chip",
  "createdAt": "2025-10-18T07:30:00.000Z",
  "updatedAt": "2025-10-18T07:30:00.000Z"
}
```

**Test Script:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Product created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData.name).to.eql("iPhone 15 Pro");
    pm.expect(jsonData.price).to.eql(999);
    
    // Lưu product ID để dùng cho các test sau
    pm.environment.set("productId", jsonData._id);
});
```

---

### STEP 5: Get All Products

**Request:**
```http
GET {{baseUrl}}/products
```

**Expected Response (200 OK):**
```json
[
  {
    "_id": "67f340a1c77586d9333ea9d8",
    "name": "iPhone 15 Pro",
    "price": 999,
    "description": "Latest iPhone with A17 chip",
    "createdAt": "2025-10-18T07:30:00.000Z",
    "updatedAt": "2025-10-18T07:30:00.000Z"
  }
]
```

---

### STEP 6: Create Order (Kiểm tra RabbitMQ)

**Request:**
```http
POST {{baseUrl}}/orders
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "productId": "{{productId}}",
  "quantity": 2,
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

**Expected Response (201 Created):**
```json
{
  "_id": "67f341b2d88586d9333ea9d9",
  "productId": "67f340a1c77586d9333ea9d8",
  "quantity": 2,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "pending",
  "createdAt": "2025-10-18T07:35:00.000Z"
}
```

**Test Script:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Order created successfully", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('_id');
    pm.expect(jsonData.status).to.eql("pending");
    
    pm.environment.set("orderId", jsonData._id);
});
```

---

## 🔐 Test Từng Service Chi Tiết

### 1️⃣ AUTH SERVICE

#### 1.1 Register - Success
```http
POST {{baseUrl}}/register
Content-Type: application/json

{
  "username": "alice",
  "password": "alice123"
}
```

#### 1.2 Register - Username Already Taken
```http
POST {{baseUrl}}/register
Content-Type: application/json

{
  "username": "alice",
  "password": "alice123"
}
```
**Expected: 400 Bad Request**
```json
{
  "message": "Username already taken"
}
```

#### 1.3 Login - Success
```http
POST {{baseUrl}}/login
Content-Type: application/json

{
  "username": "alice",
  "password": "alice123"
}
```

#### 1.4 Login - Wrong Password
```http
POST {{baseUrl}}/login
Content-Type: application/json

{
  "username": "alice",
  "password": "wrongpassword"
}
```
**Expected: 400 Bad Request**
```json
{
  "message": "Invalid username or password"
}
```

#### 1.5 Verify Token - Valid
```http
GET {{baseUrl}}/verify
Authorization: Bearer {{token}}
```

#### 1.6 Verify Token - Invalid
```http
GET {{baseUrl}}/verify
Authorization: Bearer invalid_token_here
```
**Expected: 401 Unauthorized**

---

### 2️⃣ PRODUCT SERVICE

#### 2.1 Create Product - Success
```http
POST {{baseUrl}}/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "MacBook Pro M3",
  "price": 2499,
  "description": "Powerful laptop"
}
```

#### 2.2 Create Product - Missing Name (Validation)
```http
POST {{baseUrl}}/products
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "price": 999
}
```
**Expected: 400 Bad Request**

#### 2.3 Create Product - No Auth Token
```http
POST {{baseUrl}}/products
Content-Type: application/json

{
  "name": "Test Product",
  "price": 100
}
```
**Expected: 401 Unauthorized**

#### 2.4 Get All Products
```http
GET {{baseUrl}}/products
```

#### 2.5 Get Product By ID
```http
GET {{baseUrl}}/products/{{productId}}
```

#### 2.6 Update Product
```http
PUT {{baseUrl}}/products/{{productId}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "MacBook Pro M3 Updated",
  "price": 2399,
  "description": "Sale price!"
}
```

#### 2.7 Delete Product
```http
DELETE {{baseUrl}}/products/{{productId}}
Authorization: Bearer {{token}}
```

---

### 3️⃣ ORDER SERVICE

#### 3.1 Create Order - Success
```http
POST {{baseUrl}}/orders
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "productId": "{{productId}}",
  "quantity": 3,
  "customerName": "Bob Smith",
  "customerEmail": "bob@example.com"
}
```

#### 3.2 Get All Orders
```http
GET {{baseUrl}}/orders
Authorization: Bearer {{token}}
```

#### 3.3 Get Order By ID
```http
GET {{baseUrl}}/orders/{{orderId}}
Authorization: Bearer {{token}}
```

---

## 🐰 Test RabbitMQ (Message Queue)

### 🎯 Mục đích:
RabbitMQ giúp các services giao tiếp không đồng bộ. Khi Order service tạo order mới, nó sẽ gửi message đến RabbitMQ, Product service sẽ nhận và xử lý (ví dụ: giảm số lượng tồn kho).

### 📊 Cách test RabbitMQ hiệu quả:

#### BƯỚC 1: Mở RabbitMQ Management UI

**URL:** http://localhost:15672

**Login:**
- Username: `guest`
- Password: `guest`

#### BƯỚC 2: Kiểm tra Connections & Channels

1. Vào tab **"Connections"**
   - Bạn sẽ thấy các kết nối từ Product, Order services
   - Mỗi service có 1 connection

2. Vào tab **"Channels"**
   - Mỗi connection có 1 channel để gửi/nhận messages

#### BƯỚC 3: Kiểm tra Exchanges & Queues

1. Vào tab **"Exchanges"**
   - Tìm exchange: `order_events` (hoặc tương tự)
   - Type: `direct` hoặc `topic`

2. Vào tab **"Queues"**
   - Tìm queue: `order_created_queue` (hoặc tương tự)
   - Xem số messages đang chờ xử lý

#### BƯỚC 4: Test Message Flow

**Scenario 1: Tạo Order và theo dõi Message**

1. **Trước khi tạo order**, mở RabbitMQ UI tab **"Queues"**
   - Ghi nhớ số messages hiện tại trong queue

2. **Tạo order mới qua Postman:**
```http
POST {{baseUrl}}/orders
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "productId": "{{productId}}",
  "quantity": 5,
  "customerName": "Test User",
  "customerEmail": "test@example.com"
}
```

3. **Refresh RabbitMQ UI** (F5)
   - **Nếu message được xử lý nhanh**: Số message không đổi (đã consumed)
   - **Nếu chậm**: Số message tăng lên (đang chờ xử lý)

4. **Xem Message Details:**
   - Click vào queue name
   - Scroll xuống **"Get messages"**
   - Set "Messages: 1", "Ackmode: Nack message requeue true"
   - Click **"Get Message(s)"**
   - Xem nội dung message (JSON)

**Expected Message Format:**
```json
{
  "event": "ORDER_CREATED",
  "orderId": "67f341b2d88586d9333ea9d9",
  "productId": "67f340a1c77586d9333ea9d8",
  "quantity": 5,
  "timestamp": "2025-10-18T07:35:00.000Z"
}
```

#### BƯỚC 5: Test Message Rate (Load Testing)

**Tạo nhiều orders liên tiếp để test throughput:**

1. Trong Postman, tạo request tạo order
2. Click **"Runner"** (Collection Runner)
3. Chọn request "Create Order"
4. Set **Iterations: 10** (tạo 10 orders)
5. Click **"Run"**

**Quan sát RabbitMQ UI:**
- Tab **"Queues"** → Xem **"Message rates"** graph
- **Publish rate**: Số message/giây được gửi vào queue
- **Deliver rate**: Số message/giây được xử lý

**Kết quả mong đợi:**
- Publish rate cao (vài message/giây)
- Deliver rate cao (consumer xử lý nhanh)
- Queue depth (số message chờ) nên = 0 hoặc rất thấp

#### BƯỚC 6: Kiểm tra Logs

**Check Product Service logs để xác nhận nhận được message:**

```powershell
docker-compose logs -f product
```

**Expected Output:**
```
product  | [RabbitMQ] Received message: ORDER_CREATED
product  | [RabbitMQ] Processing order: 67f341b2d88586d9333ea9d9
product  | [RabbitMQ] Product stock updated for: 67f340a1c77586d9333ea9d8
```

**Check Order Service logs:**
```powershell
docker-compose logs -f order
```

**Expected Output:**
```
order  | [RabbitMQ] Published ORDER_CREATED event
order  | [RabbitMQ] Order 67f341b2d88586d9333ea9d9 created
```

---

## 🎭 Test Scenarios (Integration Testing)

### Scenario 1: Complete User Journey

**Flow:**
1. Register user
2. Login → Get token
3. Create 3 products
4. Get all products
5. Create order for product #1
6. Create order for product #2
7. Get all orders
8. Verify RabbitMQ processed messages

**Postman Runner:**
- Tạo folder "Complete Journey"
- Add 8 requests theo thứ tự
- Run toàn bộ folder
- Tất cả phải pass!

---

### Scenario 2: Error Handling

**Test các trường hợp lỗi:**

1. **Unauthorized Access**
   ```http
   POST {{baseUrl}}/products
   # Không có Authorization header
   ```
   Expected: 401

2. **Invalid Token**
   ```http
   POST {{baseUrl}}/products
   Authorization: Bearer invalid_token
   ```
   Expected: 401

3. **Missing Required Fields**
   ```http
   POST {{baseUrl}}/products
   Authorization: Bearer {{token}}
   Content-Type: application/json
   
   {
     "price": 100
     # Missing "name"
   }
   ```
   Expected: 400

4. **Invalid Product ID in Order**
   ```http
   POST {{baseUrl}}/orders
   Authorization: Bearer {{token}}
   Content-Type: application/json
   
   {
     "productId": "invalid_id",
     "quantity": 1
   }
   ```
   Expected: 400 or 404

---

### Scenario 3: RabbitMQ Resilience Test

**Mục đích:** Test hệ thống khi RabbitMQ down

1. **Stop RabbitMQ:**
   ```powershell
   docker-compose stop rabbitmq
   ```

2. **Tạo Order:**
   ```http
   POST {{baseUrl}}/orders
   # Request vẫn nên thành công nhưng message không được gửi
   ```

3. **Start RabbitMQ lại:**
   ```powershell
   docker-compose start rabbitmq
   ```

4. **Verify:** Services tự động reconnect và tiếp tục hoạt động

---

## 📈 Performance Testing với Postman

### Test 1: Concurrent Requests

**Setup:**
1. Collection Runner
2. Delay: 0ms
3. Iterations: 50
4. Save responses: No (để nhanh hơn)

**Requests:**
- GET all products
- GET all orders

**Metrics để theo dõi:**
- Average response time
- Min/Max response time
- Fail rate

---

### Test 2: Load Testing với nhiều users

**Setup:**
1. Tạo 10 users khác nhau (script Pre-request)
2. Mỗi user tạo 1 product và 1 order
3. Run 10 iterations

**Pre-request Script:**
```javascript
var users = [
    {username: "user1", password: "pass1"},
    {username: "user2", password: "pass2"},
    // ... 10 users
];

var currentUser = users[pm.variables.get("iteration") % users.length];
pm.environment.set("currentUsername", currentUser.username);
pm.environment.set("currentPassword", currentUser.password);
```

---

## 🎯 Checklist Test Đầy Đủ

### ✅ Auth Service
- [ ] Register user mới
- [ ] Register với username đã tồn tại (expect fail)
- [ ] Login thành công
- [ ] Login sai password (expect fail)
- [ ] Verify token hợp lệ
- [ ] Verify token không hợp lệ (expect fail)

### ✅ Product Service
- [ ] Create product với token hợp lệ
- [ ] Create product không có token (expect fail)
- [ ] Create product thiếu field (expect fail)
- [ ] Get all products
- [ ] Get product by ID
- [ ] Update product
- [ ] Delete product

### ✅ Order Service
- [ ] Create order với product hợp lệ
- [ ] Create order với product không tồn tại (expect fail)
- [ ] Get all orders
- [ ] Get order by ID

### ✅ RabbitMQ
- [ ] Order service gửi message khi tạo order
- [ ] Product service nhận và xử lý message
- [ ] Queue không bị tồn đọng messages
- [ ] Services reconnect khi RabbitMQ restart

### ✅ API Gateway
- [ ] Route đúng đến Auth service
- [ ] Route đúng đến Product service
- [ ] Route đúng đến Order service
- [ ] CORS headers đúng
- [ ] Error handling khi service down

---

## 📝 Tips & Best Practices

### 1. Sử dụng Environment Variables
- Tránh hardcode URLs, tokens
- Dễ switch giữa Local/Dev/Production

### 2. Tự động hóa với Test Scripts
- Lưu tokens, IDs tự động
- Validate responses
- Fail fast khi có lỗi

### 3. Organize Collections
```
EProject Microservices/
├── 01-Setup/
│   ├── Health Checks
│   └── Environment Verification
├── 02-Auth/
│   ├── Register
│   ├── Login
│   └── Verify
├── 03-Products/
│   ├── Create
│   ├── Get All
│   └── CRUD Operations
├── 04-Orders/
│   └── ...
└── 05-Integration Tests/
    └── Complete User Journey
```

### 4. Monitor RabbitMQ
- Luôn mở RabbitMQ UI khi test
- Theo dõi message rates
- Check for errors in logs

### 5. Document Expected Behaviors
- Ghi chú trong Description của mỗi request
- Expected status code
- Expected response format

---

## 🚨 Common Issues & Solutions

### Issue 1: Token Expired
**Error:** `401 Unauthorized` sau một thời gian
**Solution:** Login lại để lấy token mới

### Issue 2: Connection Refused
**Error:** `ECONNREFUSED`
**Solution:** 
```powershell
docker-compose ps  # Check services running
docker-compose up -d  # Start if stopped
```

### Issue 3: Messages stuck in RabbitMQ
**Error:** Queue depth tăng không ngừng
**Solution:**
- Check consumer logs: `docker-compose logs product`
- Restart consumer: `docker-compose restart product`

### Issue 4: CORS Error in Browser
**Error:** `No 'Access-Control-Allow-Origin' header`
**Solution:** API Gateway đã config CORS, nên không lỗi. Nếu lỗi thì check API Gateway logs.

---

Bạn có muốn tôi tạo thêm **Postman Collection JSON file** để import trực tiếp không? 🚀
