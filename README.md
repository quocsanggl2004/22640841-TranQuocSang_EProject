# EProject Microservices - Business Logic Testing

## 📋 Tổng quan dự án

Đây là một hệ thống microservices bao gồm 4 services chính:

### 🏗️ Kiến trúc hệ thống
```
API Gateway (3000) → Auth Service (3001)
                  → Product Service (3002)  
                  → Order Service (3003)
```

### 🎯 Business Logic chính:
1. **Authentication** - Đăng ký, đăng nhập, xác thực JWT
2. **Product Management** - CRUD sản phẩm
3. **Order Processing** - Tạo đơn hàng, xử lý qua message queue
4. **API Gateway** - Routing và proxy requests

---

## 🚀 Quick Start

### 🎯 Option 1: Automated Setup (Recommended)
```bash
# Double-click để chạy automated setup
setup.bat

# Hoặc chạy từ terminal:
./setup.bat
```

### 🛠️ Option 2: Manual Setup

#### 1. Setup Environment
```bash
# Copy environment template
copy .env.example .env
# 🇻🇳 Lý do: .env.example là template an toàn, .env chứa config thật

# Install dependencies cho tất cả services
npm run install:all
```

#### 2. Configure Environment
Edit file `.env` với config thật của bạn:
```bash
# Example: Thay đổi JWT secret
JWT_SECRET=YourRealSecretKey123!@#

# Example: Nếu dùng MongoDB với authentication
MONGODB_AUTH_URI=mongodb://admin:password@localhost:27017/auth_db
```

#### 3. Start Database
```bash
# Option A: Local MongoDB
mongod --dbpath="C:\data\db"

# Option B: Docker MongoDB  
docker-compose up mongodb

# Option C: MongoDB Atlas (cloud) - update .env với Atlas URI
```

#### 4. Start Services
```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm start

# With Docker (all services + MongoDB + RabbitMQ)
npm run docker:up
```

### 2. Verify Services
Kiểm tra tất cả services đang chạy:
- http://localhost:3000/health (API Gateway)
- http://localhost:3001/health (Auth Service)
- http://localhost:3002/health (Product Service)
- http://localhost:3003/health (Order Service)

### 🇻🇳 Troubleshooting:
- **MongoDB**: Nếu connection error, check MongoDB đang chạy chưa
- **RabbitMQ**: Nếu message queue error, install RabbitMQ hoặc dùng Docker
- **Port conflicts**: Check ports 3000-3003 có bị occupy không
- **.env missing**: Chạy `setup.bat` hoặc manual copy `.env.example` → `.env`

---

## 🧪 Test Business Logic với POSTMAN

### Collection Setup
Tạo Postman Collection với environment variables:
```json
{
  "gateway_url": "http://localhost:3000",
  "auth_url": "http://localhost:3001", 
  "product_url": "http://localhost:3002",
  "order_url": "http://localhost:3003",
  "token": ""
}
```

---

## 🔐 1. Authentication Business Logic

> **🇻🇳 Lưu ý**: Auth service chỉ yêu cầu `username` và `password`, không cần email

### Test Case 1.1: User Registration
```http
POST {{auth_url}}/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Result:**
- Status: 200 OK (⚠️ Note: Trả về 200, không phải 201)
- Response: User object với `_id` và `username`
- Database: New user record với password đã hash

> **🇻🇳 Giải thích**: Service dùng bcrypt để hash password trước khi lưu DB

### Test Case 1.2: User Login
```http
POST {{auth_url}}/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Result:**
- Status: 200 OK
- Response: `{ "token": "jwt_token_here" }`
- Save token to environment variable

> **🇻🇳 Quan trọng**: Token được generate bằng user ID, không phải username

### Test Case 1.3: Protected Route Access
```http
GET {{auth_url}}/dashboard
x-auth-token: {{token}}
```

**Expected Result:**
- Status: 200 OK with valid token
- Status: 401 Unauthorized without token
- Response: `{ "message": "Welcome to dashboard" }`

> **🇻🇳 Lưu ý**: Auth middleware dùng header `x-auth-token`, không phải `Authorization: Bearer`

### Test Case 1.4: Token Verification  
```http
GET {{auth_url}}/verify
Authorization: Bearer {{token}}
```

**Expected Result:**
- Status: 200 OK
- Response: `{ "user": decoded_user, "message": "Token is valid" }`

> **🇻🇳 Chú ý**: Endpoint này dùng `Authorization: Bearer`, khác với dashboard

---

## 📦 2. Product Management Business Logic

> **🇻🇳 Quan trọng**: Tất cả product endpoints đều require authentication

### Test Case 2.1: Create Product
```http
POST {{product_url}}/api/products
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Test Product",
  "description": "Product description", 
  "price": 99.99
}
```

**Expected Result:**
- Status: 201 Created
- Response: Product object với MongoDB `_id`
- Database: New product record

> **🇻🇳 Schema**: Chỉ cần `name`, `price` (required) và `description` (optional)

### Test Case 2.2: Get All Products
```http
GET {{product_url}}/api/products
Authorization: Bearer {{token}}
```

**Expected Result:**
- Status: 200 OK
- Response: Array of all products
- ⚠️ **Authentication required** (khác với mô tả ban đầu)

### Test Case 2.3: Create Order via Product Service
```http
POST {{product_url}}/api/products/buy
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "ids": ["product_id_1", "product_id_2"]
}
```

**Expected Result:**
- Status: 201 Created
- Response: Complete order với status "completed"
- Message Queue: Order published và processed
- Long polling: Chờ đến khi order hoàn thành

> **🇻🇳 Đặc biệt**: Endpoint này implement long polling và message queue processing

### Test Case 2.4: Get Order Status
```http
GET {{product_url}}/api/products/order/{{order_id}}
Authorization: Bearer {{token}}
```

**Expected Result:**
- Status: 200 OK hoặc 404 Not Found
- Response: Order status và details

---

## 🛒 3. Order Processing Business Logic

### Test Case 3.1: Create Order (Direct)
```http
POST {{order_url}}/
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "products": [
    {
      "name": "Test Product",
      "price": 99.99
    }
  ]
}
```

**Expected Result:**
- Status: 201 Created
- Response: Order với calculated `totalPrice`
- Database: Order record với user từ JWT token

> **🇻🇳 Tính năng**: Service tự động tính tổng tiền từ array products

### Test Case 3.2: Get User Orders
```http
GET {{order_url}}/
Authorization: Bearer {{token}}
```

**Expected Result:**
- Status: 200 OK
- Response: Array orders của user hiện tại
- Filtered by `req.user.username` từ JWT

### Test Case 3.3: Get Specific Order
```http
GET {{order_url}}/{{order_id}}
Authorization: Bearer {{token}}
```

**Expected Result:**
- Status: 200 OK for existing order
- Status: 404 for non-existent order

---

## 🌐 4. API Gateway Business Logic

### Test Case 4.1: Auth Proxy
```http
POST {{gateway_url}}/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Result:**
- Request proxied to `http://localhost:3001`
- Same response as direct auth call
- 5000ms timeout configured

### Test Case 4.2: Product Proxy
```http
GET {{gateway_url}}/products/api/products
Authorization: Bearer {{token}}
```

**Expected Result:**
- Request proxied to `http://localhost:3002`
- Path: `/products/api/products` → `/api/products` on service

### Test Case 4.3: Order Proxy
```http
GET {{gateway_url}}/orders/
Authorization: Bearer {{token}}
```

**Expected Result:**
- Request proxied to `http://localhost:3003`
- Headers preserved including Authorization

### Test Case 4.4: Gateway Health Check
```http
GET {{gateway_url}}/health
```

**Expected Result:**
- Status: 200 OK
- Response: `{ "status": "API Gateway is running", "timestamp": "..." }`

---

## 🔄 5. Message Queue Business Logic

> **🇻🇳 Kiến trúc**: RabbitMQ với 2 queues: "orders" và "products"

### Test Case 5.1: Order Processing Flow
1. **Product Service**: POST `/api/products/buy` với product IDs
2. **Message Published**: Order data sent to "orders" queue
3. **Order Service**: Consumer processing order
4. **Response Sent**: Completion message to "products" queue  
5. **Product Service**: Long polling until order completed

**Message Flow:**
```
Product Service → "orders" queue → Order Service
Order Service → "products" queue → Product Service
```

**Expected Behavior:**
- Order message contains: `{ products, username, orderId }`
- Order saved to database với user info
- Completion message với order details
- Product service returns completed order

> **🇻🇳 Timeout**: RabbitMQ connection có delay 5-20 seconds khi start

---

## 📊 6. Gaps và Missing Logic

### ⚠️ Missing Implementations

#### Product Service:
```javascript
// Missing: Update Product
PUT {{product_url}}/api/products/{{product_id}}
// Missing: Delete Product  
DELETE {{product_url}}/api/products/{{product_id}}
// Missing: Get Product by ID
GET {{product_url}}/api/products/{{product_id}}
```

#### Auth Service:
```javascript
// Missing: Get User Profile
GET {{auth_url}}/profile
// Missing: Update Password
PUT {{auth_url}}/password
// Missing: Logout (token blacklist)
POST {{auth_url}}/logout
```

#### Order Service: 
```javascript
// Missing: Update Order Status
PUT {{order_url}}/{{order_id}}/status
// Missing: Cancel Order
DELETE {{order_url}}/{{order_id}}
```

### 🔧 Issues cần Fix:

1. **Authentication Inconsistency**: 
   - Dashboard dùng `x-auth-token` header
   - Verify dùng `Authorization: Bearer` header
   - Product/Order services dùng `Authorization: Bearer`

2. **Product Routes**: Route `/` conflict với health check

3. **Error Handling**: Thiếu proper error responses và validation

4. **Order Model**: Schema thiếu user field trong model definition

---

## 🛠️ Testing Environment Setup

### Prerequisites
```bash
# MongoDB
mongod --dbpath="path/to/data"

# RabbitMQ  
rabbitmq-server
# Management UI: http://localhost:15672 (guest/guest)
```

### Postman Environment Variables
```json
{
  "gateway_url": "http://localhost:3000",
  "auth_url": "http://localhost:3001",
  "product_url": "http://localhost:3002", 
  "order_url": "http://localhost:3003",
  "token": "",
  "user_id": "",
  "product_id": "",
  "order_id": ""
}
```

### Collection Scripts
```javascript
// Pre-request Script (for auth)
if (pm.environment.get("token")) {
    pm.request.headers.add({
        key: "Authorization",
        value: "Bearer " + pm.environment.get("token")
    });
}

// Test Script (save response data)
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Save token from login
if (pm.response.json().token) {
    pm.environment.set("token", pm.response.json().token);
}

// Save product ID
if (pm.response.json()._id) {
    pm.environment.set("product_id", pm.response.json()._id);
}
```

---

## 🐛 Common Test Scenarios

### Error Handling Tests
- Invalid credentials → 400 với message
- Missing authentication → 401 Unauthorized  
- Invalid product data → 400 với validation error
- Database connection errors → 500 Server error
- Service unavailability → 500 qua gateway

### Edge Cases
- Empty request bodies → 400 Bad Request
- Invalid JSON format → 400 Bad Request
- Very long strings → Validation error
- Special characters in data → Proper encoding
- Concurrent requests → Data consistency
- Service timeout → 500 after 5000ms

---

## 📝 Test Documentation

### Test Results Format
```
✅ PASS: User can register với username/password
✅ PASS: User can login và receive JWT token  
❌ FAIL: Dashboard endpoint dùng sai header format
✅ PASS: Product creation requires valid JWT
✅ PASS: Order total calculation đúng logic
⚠️  WARN: Missing CRUD endpoints cho Product
```

### 🇻🇳 Lưu ý quan trọng:
1. **Headers**: Chú ý sự khác biệt giữa `x-auth-token` và `Authorization: Bearer`
2. **Responses**: Một số endpoint trả về 200 thay vì 201 cho creation
3. **Message Queue**: Cần đợi RabbitMQ start up (5-20 giây)
4. **Long Polling**: Product buy endpoint có thể mất vài giây
5. **Database**: Mỗi service dùng separate MongoDB database

---

## 🎯 Testing Checklist

### Authentication Service ✅
- [x] User registration (username/password only)
- [x] User login (JWT generation)  
- [x] Token validation (2 different header formats)
- [x] Protected routes (dashboard)
- [x] Invalid credentials handling
- [ ] ❌ Missing: Profile management, password update

### Product Service ⚠️  
- [x] Product creation (authenticated)
- [x] Get all products (authenticated)
- [x] Order creation via buy endpoint
- [x] Long polling cho order completion
- [ ] ❌ Missing: Update, Delete, Get by ID

### Order Service ✅
- [x] Order creation (manual)
- [x] Order retrieval by user
- [x] Get specific order
- [x] Message queue consumption
- [ ] ❌ Missing: Order status updates, cancellation

### API Gateway ✅
- [x] Request routing to all services
- [x] Response proxying
- [x] Error handling (500 for unavailable services)
- [x] CORS headers
- [x] Health check endpoint

### Integration ⚠️
- [x] Service communication qua gateway
- [x] Message queue flow (orders ↔ products)
- [x] JWT token passing
- [ ] ❌ Missing: Error propagation consistency
- [ ] ❌ Missing: Service discovery/health monitoring