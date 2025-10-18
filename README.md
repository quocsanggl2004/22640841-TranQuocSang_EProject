# 🚀 HƯỚNG DẪN SETUP CI/CD VỚI GITHUB ACTIONS

## 📋 MỤC TIÊU BƯỚC 9 & 10

- **Bước 9:** Thao tác với GitHub Actions - CI/CD tự động
- **Bước 10:** CI/CD liên kết với Docker (build & push images)

---

## ✅ ĐÃ HOÀN THÀNH

File `.github/workflows/ci-cd.yml` đã được tạo sẵn với 3 jobs:

1. **Test Job** - Chạy integration tests cho auth và product service
2. **Build & Push Job** - Build và push Docker images lên Docker Hub
3. **Notify Job** - Thông báo kết quả build

---

## 🔧 CÁCH SETUP (5 BƯỚC)

### **BƯỚC 1: Tạo Tài Khoản Docker Hub**

1. Truy cập: https://hub.docker.com/
2. Đăng ký tài khoản miễn phí
3. Ghi nhớ **username** (ví dụ: `quocsanggl2004`)

### **BƯỚC 2: Tạo Access Token Docker Hub**

1. Đăng nhập Docker Hub
2. Click vào **Account Settings** (góc phải trên)
3. Chọn **Security** → **New Access Token**
4. Token name: `github-actions`
5. Permissions: **Read, Write, Delete**
6. Click **Generate** → **Copy token** (chỉ hiện 1 lần duy nhất!)

### **BƯỚC 3: Thêm Secrets vào GitHub Repository**

1. Vào repository GitHub của bạn
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Thêm các secrets sau:

| Secret Name | Value | Ví dụ |
|-------------|-------|-------|
| `DOCKER_USERNAME` | Docker Hub username | `quocsanggl2004` |
| `DOCKER_PASSWORD` | Access token vừa tạo | `dckr_pat_abc123...` |
| `MONGODB_AUTH_URI` | MongoDB URI cho auth | `mongodb://admin:password@localhost:27017/auth_db?authSource=admin` |
| `MONGODB_PRODUCT_URI` | MongoDB URI cho product | `mongodb://admin:password@localhost:27017/product_db?authSource=admin` |
| `JWT_SECRET` | JWT secret key | `test_secret_key` |

**Lưu ý:** Mỗi secret phải click **Add secret** riêng.

### **BƯỚC 4: Push Code Lên GitHub**

```powershell
# Từ thư mục gốc dự án
git add .
git commit -m "Add CI/CD with GitHub Actions and Docker integration"
git push origin master
```

### **BƯỚC 5: Xem Kết Quả**

1. Vào GitHub repository
2. Click tab **Actions**
3. Bạn sẽ thấy workflow "CI/CD Pipeline" đang chạy
4. Click vào workflow để xem chi tiết

**Quy trình tự động:**
```
Push code → GitHub Actions trigger
         ↓
    Run tests (auth, product)
         ↓
    Build Docker images (4 services)
         ↓
    Push images to Docker Hub
         ↓
    Send notification
```

---

## 📊 WORKFLOW CHI TIẾT

### **Job 1: Test (Matrix Strategy)**

Chạy song song tests cho 2 services:

```yaml
strategy:
  matrix:
    service: [auth, product]
```

**Các bước:**
1. Checkout code từ repository
2. Setup Node.js 18
3. Install dependencies cho từng service
4. Run `npm test` với environment variables từ Secrets

**Thời gian:** ~2-3 phút

### **Job 2: Build and Push Docker Images**

Chạy **SAU** khi tests pass, build 4 services:

```yaml
strategy:
  matrix:
    service: [auth, product, order, api-gateway]
```

**Các bước:**
1. Checkout code
2. Setup Docker Buildx (hỗ trợ multi-platform builds)
3. Login Docker Hub với credentials từ Secrets
4. Build và push images với 2 tags:
   - `latest` - Tag mới nhất
   - `<commit-sha>` - Tag theo commit cụ thể (rollback dễ dàng)

**Docker images được push:**
```
quocsanggl2004/eproject-auth:latest
quocsanggl2004/eproject-auth:abc123def456
quocsanggl2004/eproject-product:latest
quocsanggl2004/eproject-product:abc123def456
quocsanggl2004/eproject-order:latest
quocsanggl2004/eproject-order:abc123def456
quocsanggl2004/eproject-api-gateway:latest
quocsanggl2004/eproject-api-gateway:abc123def456
```

**Thời gian:** ~5-7 phút (4 images song song)

### **Job 3: Notify**

Chạy **SAU** build job (dù success hay fail):

```yaml
needs: build-and-push
if: always()
```

In ra console:
- Build status (success/failure)
- Commit SHA
- User trigger workflow

---

## 🎯 KIỂM TRA HOẠT ĐỘNG

### **1. Kiểm tra trên GitHub Actions**

**Truy cập:** `https://github.com/<username>/<repo>/actions`

**Kết quả mong đợi:**
- ✅ Test job: Green checkmark
- ✅ Build-and-push job: Green checkmark  
- ✅ Notify job: Green checkmark

**Xem logs chi tiết:**
- Click vào workflow run
- Click vào từng job để xem steps
- Mở rộng step để xem logs

### **2. Kiểm tra trên Docker Hub**

**Truy cập:** `https://hub.docker.com/u/<username>`

**Kết quả mong đợi:**
- Thấy 4 repositories mới:
  - `eproject-auth`
  - `eproject-product`
  - `eproject-order`
  - `eproject-api-gateway`

**Kiểm tra tags:**
- Click vào repository
- Tab **Tags** → Thấy `latest` và `<commit-sha>`

### **3. Pull Images Về Local**

```powershell
# Pull image mới nhất
docker pull quocsanggl2004/eproject-auth:latest

# Kiểm tra images
docker images | findstr eproject
```

---

## 📸 CHỨNG MINH TRONG BÀI TRÌNH BÀY

### **Bước 9: GitHub Actions (0.5 điểm)**

**Cần chứng minh:**

1. **Workflow đã chạy thành công:**
   - Mở tab Actions trên GitHub
   - Chỉ workflow run với checkmark xanh
   - Mở logs của test job

2. **Tự động trigger khi push:**
   - Sửa file README.md (thêm 1 dòng bất kỳ)
   - `git add . && git commit -m "Test CI/CD" && git push`
   - Refresh tab Actions → Thấy workflow mới chạy

3. **Tests chạy tự động:**
   - Click vào test job
   - Mở step "Run tests - auth"
   - Chỉ output: `5 passing`
   - Mở step "Run tests - product"  
   - Chỉ output: `2 passing`

### **Bước 10: CI/CD + Docker (0.5 điểm)**

**Cần chứng minh:**

1. **Docker images được build:**
   - Click vào build-and-push job
   - Mở step "Build and push Docker image - auth"
   - Chỉ output: `pushing manifest for docker.io/...`

2. **Images trên Docker Hub:**
   - Mở Docker Hub trong browser
   - Chỉ 4 repositories với tag `latest`
   - Click vào 1 repo → Chỉ tab Tags → 2 tags

3. **Pull và chạy image từ Docker Hub:**
   ```powershell
   # Pull image
   docker pull quocsanggl2004/eproject-auth:latest
   
   # Verify image
   docker images quocsanggl2004/eproject-auth
   
   # Run container (nếu cần demo)
   docker run -d -p 3000:3000 --name test-auth quocsanggl2004/eproject-auth:latest
   ```

---

## 🔍 WORKFLOW FILE GIẢI THÍCH

### **Trigger Events**

```yaml
on:
  push:
    branches: [ master, main ]  # Chạy khi push lên master/main
  pull_request:
    branches: [ master, main ]  # Chạy khi tạo PR vào master/main
```

### **Matrix Strategy**

Chạy song song nhiều jobs thay vì tuần tự:

```yaml
strategy:
  matrix:
    service: [auth, product, order, api-gateway]
# → Tạo 4 jobs song song thay vì 4 jobs tuần tự (tiết kiệm thời gian)
```

### **Job Dependencies**

```yaml
needs: test  # Build job chỉ chạy SAU khi test job thành công
if: github.event_name == 'push'  # Chỉ chạy với push, không chạy với PR
```

### **Secrets Usage**

```yaml
username: ${{ secrets.DOCKER_USERNAME }}  # Lấy từ GitHub Secrets
password: ${{ secrets.DOCKER_PASSWORD }}  # Không bao giờ log ra console
```

### **Docker Tags**

```yaml
tags: |
  ${{ secrets.DOCKER_USERNAME }}/eproject-${{ matrix.service }}:latest
  ${{ secrets.DOCKER_USERNAME }}/eproject-${{ matrix.service }}:${{ github.sha }}
```

**Ví dụ với commit `abc123def456`:**
- `quocsanggl2004/eproject-auth:latest`
- `quocsanggl2004/eproject-auth:abc123def456`

**Lợi ích:**
- `latest` - Dễ pull image mới nhất
- `<commit-sha>` - Rollback về version cũ nếu cần

---

## 🛠️ TROUBLESHOOTING

### **Lỗi: Authentication failed (Docker Hub)**

**Nguyên nhân:** Sai username hoặc password

**Giải pháp:**
1. Kiểm tra `DOCKER_USERNAME` trong Secrets (không có khoảng trắng)
2. Tạo lại Access Token từ Docker Hub
3. Update `DOCKER_PASSWORD` secret

### **Lỗi: Tests failed**

**Nguyên nhân:** MongoDB URI không đúng hoặc thiếu secrets

**Giải pháp:**
1. Kiểm tra các secrets: `MONGODB_AUTH_URI`, `MONGODB_PRODUCT_URI`, `JWT_SECRET`
2. Chạy test local trước: `npm test`
3. Xem logs chi tiết trong GitHub Actions

### **Lỗi: Docker build failed**

**Nguyên nhân:** Dockerfile có vấn đề hoặc thiếu dependencies

**Giải pháp:**
1. Build local trước: `docker build -t test-image ./auth`
2. Kiểm tra Dockerfile syntax
3. Xem logs build trong GitHub Actions

### **Lỗi: Workflow không trigger**

**Nguyên nhân:** File `.github/workflows/ci-cd.yml` không đúng vị trí

**Giải pháo:**
1. Đảm bảo file ở đúng path: `.github/workflows/ci-cd.yml`
2. Push file lên GitHub
3. Kiểm tra tab Actions có workflow không

---

## 📚 TÀI LIỆU THAM KHẢO

- GitHub Actions Documentation: https://docs.github.com/en/actions
- Docker Hub: https://hub.docker.com/
- GitHub Actions Marketplace: https://github.com/marketplace?type=actions

---

## 📌 CHECKLIST HOÀN THÀNH

- [ ] Tạo tài khoản Docker Hub
- [ ] Tạo Access Token Docker Hub
- [ ] Thêm 5 secrets vào GitHub repository
- [ ] Push code với file `.github/workflows/ci-cd.yml`
- [ ] Workflow chạy thành công trên GitHub Actions
- [ ] 4 Docker images được push lên Docker Hub
- [ ] Pull được images từ Docker Hub về local
- [ ] Chuẩn bị demo: Mở sẵn tab GitHub Actions và Docker Hub

---

**TỔNG ĐIỂM BƯỚC 9 + 10: 1.0 điểm**

- ✅ GitHub Actions hoạt động: **0.5 điểm**
- ✅ CI/CD + Docker Hub: **0.5 điểm**

Good luck! 🚀
