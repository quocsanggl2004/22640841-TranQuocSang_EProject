# EProject Microservices

Một hướng dẫn ngắn gọn để khởi tạo, build, containerize và test dự án microservices (Node.js + Express + MongoDB + RabbitMQ). README này để bạn có thể nhanh chóng chạy hệ thống local hoặc bằng Docker và test các logic API bằng Postman.

---

## Tổng quan (Overview)

- API Gateway (port 3003) — entry point cho tất cả request
- Auth service (port 3000) — đăng ký, đăng nhập, verify token
- Product service (port 3001) — CRUD sản phẩm, endpoint buy
- Order service (port 3002) — tạo/quản lý đơn hàng

Services communicate qua RabbitMQ (amqp) và MongoDB.

---

## Quick reference — URLs

- API Gateway (recommended): http://localhost:3003
- Auth (direct): http://localhost:3000
- Product (direct): http://localhost:3001
- Order (direct): http://localhost:3002
- RabbitMQ management UI: http://localhost:15672 (user: admin / pass: password)
- MongoDB (default): mongodb://localhost:27017

> Khi chạy bằng Docker Compose, containers resolve nhau bằng container name (ví dụ `http://auth:3000`). Khi chạy local (not in Docker), dùng `localhost`.

---

## Prerequisites

- Node.js 18+
- Docker Desktop (nếu chạy bằng Docker) hoặc MongoDB + RabbitMQ local
- Git

---

## Quick local setup (without Docker)

1. Clone repo

```powershell
git clone https://github.com/quocsanggl2004/22640841-TranQuocSang_EProject.git
cd 22640841-TranQuocSang_EProject
```

2. Install dependencies for each service (root package.json has helper scripts)

```powershell
npm run install:all
```

3. Start services locally (dev) — runs services with nodemon (root has scripts)

```powershell
npm run dev
```

4. Verify health endpoints (open in browser or curl)

```powershell
curl http://localhost:3003/health  # API Gateway
curl http://localhost:3000/health  # Auth
curl http://localhost:3001/health  # Product
curl http://localhost:3002/health  # Order
```

Notes:
- If running local (not Docker), make sure your `.env` files point to `localhost` Mongo/Rabbit or to your running services.

---

## Docker: build & run (recommended)

1. Ensure Docker Desktop is running.

2. From project root, build images from Dockerfiles (optional):

```powershell
docker-compose build --no-cache
```

3. Start system (detached):

```powershell
docker-compose up -d
```

4. Check status:

```powershell
docker-compose ps
```

5. View logs (real-time):

```powershell
docker-compose logs -f
docker-compose logs -f api-gateway
```

6. Stop and remove containers (optionally remove volumes):

```powershell
docker-compose down
docker-compose down -v   # remove volumes (DB data)
```

Notes:
- Docker Compose config uses container names for internal networking (e.g. `auth`, `product`, `order`). API Gateway is configured to proxy to these container names when running in Docker.

---

## Environment variables

Each service can have its own `.env` file (see service folders). Important ones:

- Auth: JWT_SECRET, MONGODB_AUTH_URI
- Product: MONGODB_PRODUCT_URI, RABBITMQ_URI
- Order: MONGODB_ORDER_URI, RABBITMQ_URI
- API Gateway: API_GATEWAY_PORT

When running Docker Compose the compose file sets appropriate envs for services (Mongo and RabbitMQ urls point to container names).

---

## Postman — Test plan (logic names only)

Below are the test flows / logic you should run in Postman. (Bạn sẽ dán ảnh vào README từng bước sau.)

1) Health checks
- GET /health on API Gateway and each service

2) Auth flows
- Register new user
- Login & obtain JWT token
- Verify token & access protected endpoint

3) Product flows
- Create product (requires JWT)
- Get all products
- Get product by ID
- Update product
- Delete product
- Buy products (POST /products/buy) — sends message to RabbitMQ and waits for order completion

4) Order flows
- Create order (direct)
- Get user's orders
- Get order by ID
- Update order status (admin flow)

5) Error / edge cases
- Login with wrong password (expect 401)
- Access protected route without token (expect 401)
- Create product with invalid data (expect 400)
- Create order with empty items (expect 400)
- Service down scenario (expect 502 via API Gateway)

6) Security tests
- Expired JWT, malformed JWT
- SQL / NoSQL injection attempts
- Very large payloads

For each test item you can add a screenshot and paste it in `public/images/img_readme/` then reference it in README if desired.

---

## Useful Docker commands (cheat sheet)

```powershell
# Start (detached)
docker-compose up -d

# Stop and remove containers
docker-compose down

# Build images
docker-compose build

# Tail logs
docker-compose logs -f api-gateway

# List running containers
docker ps

# Enter a running container
docker-compose exec api-gateway sh
```

---

## Troubleshooting

- If API Gateway returns ENOTFOUND for service host, check whether you're running in Docker (container names) vs local (localhost). Use container names when running with Docker Compose.
- If RabbitMQ connection fails, ensure RabbitMQ container is up: `docker-compose ps` and `http://localhost:15672`.
- For DB issues, check Mongo logs and connection strings in service env files.

---

## Project structure (short)

```
EProject-Phase-1/
├── api-gateway/
├── auth/
├── product/
├── order/
├── public/
├── docker-compose.yml
└── package.json
```

---

If you want, I can now:
- Add the placeholder headings in README for where to drop your Postman screenshots, or
- Generate a ready-to-run PowerShell script that builds, starts and runs health checks.

Chọn 1 việc trong 2 để tôi tiếp tục (hoặc cả hai).
