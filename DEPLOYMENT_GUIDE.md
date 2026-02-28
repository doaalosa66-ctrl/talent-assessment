# 测试/生产环境部署指南

## 架构设计

### 服务器架构（单服务器双环境）
```
腾讯云服务器 (1台)
├── 测试环境 (端口 3100/3101)
│   ├── 前端: http://test.yourdomain.com (Nginx反向代理 → 3100)
│   ├── 后端: 内部端口 3101
│   └── 数据库: PostgreSQL (端口 5433)
│
└── 生产环境 (端口 3000/3001)
    ├── 前端: https://yourdomain.com (Nginx反向代理 → 3000)
    ├── 后端: 内部端口 3001
    └── 数据库: PostgreSQL (端口 5432)
```

### Git分支策略
```
main 分支 → 自动部署到生产环境
dev 分支  → 自动部署到测试环境
```

---

## 第一步：服务器准备

### 1.1 登录腾讯云服务器
```bash
ssh root@your-server-ip
```

### 1.2 安装必要软件
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 安装 Git
apt install git -y

# 安装 Nginx
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

---

## 第二步：创建项目目录结构

```bash
# 创建项目根目录
mkdir -p /var/www
cd /var/www

# 创建测试环境目录
mkdir -p talent-assessment-test
cd talent-assessment-test
git clone -b dev https://github.com/your-username/your-repo.git .

# 创建生产环境目录
cd /var/www
mkdir -p talent-assessment-prod
cd talent-assessment-prod
git clone -b main https://github.com/your-username/your-repo.git .
```

---

## 第三步：配置环境变量

### 3.1 测试环境 `.env`
```bash
cd /var/www/talent-assessment-test
nano .env
```

内容：
```env
# 服务器配置
PORT=3101
NODE_ENV=development

# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-631d60b3ce3f4315b624ad75038ba0c8

# JWT 配置
JWT_SECRET=xRLqXg3dAhhpnBqdB/rg/UnWRG/EAZLh7bklFVvw7/24bW3AUvT39qvrgzRll0U5
JWT_EXPIRES_IN=24h

# PostgreSQL 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=talent_assessment_test
DB_USER=admin
DB_PASSWORD=67b4f4103b25201507ac37acf86a9898

# 数据库连接池配置
DB_POOL_MIN=2
DB_POOL_MAX=10

# CORS 配置
CORS_ORIGIN=http://test.yourdomain.com

# 日志配置
LOG_LEVEL=debug
LOG_DIR=./logs

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# PgAdmin 配置
PGADMIN_EMAIL=admin@talent.com
PGADMIN_PASSWORD=857ca84b84870a1a15f1fb355ec4f119
```

### 3.2 生产环境 `.env`
```bash
cd /var/www/talent-assessment-prod
nano .env
```

内容：
```env
# 服务器配置
PORT=3001
NODE_ENV=production

# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-631d60b3ce3f4315b624ad75038ba0c8

# JWT 配置
JWT_SECRET=xRLqXg3dAhhpnBqdB/rg/UnWRG/EAZLh7bklFVvw7/24bW3AUvT39qvrgzRll0U5
JWT_EXPIRES_IN=24h

# PostgreSQL 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_NAME=talent_assessment_prod
DB_USER=admin
DB_PASSWORD=67b4f4103b25201507ac37acf86a9898

# 数据库连接池配置
DB_POOL_MIN=2
DB_POOL_MAX=10

# CORS 配置
CORS_ORIGIN=https://yourdomain.com

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs

# 速率限制配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# PgAdmin 配置
PGADMIN_EMAIL=admin@talent.com
PGADMIN_PASSWORD=857ca84b84870a1a15f1fb355ec4f119
```

---

## 第四步：修改 docker-compose.yml（测试环境）

### 4.1 测试环境端口配置
```bash
cd /var/www/talent-assessment-test
nano docker-compose.yml
```

修改端口映射：
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # 测试环境用5433

  backend:
    ports:
      - "3101:3001"  # 测试环境后端用3101

  frontend:
    ports:
      - "3100:3000"  # 测试环境前端用3100

  pgadmin:
    ports:
      - "5051:80"    # 测试环境pgAdmin用5051
```

### 4.2 生产环境保持默认端口
```bash
cd /var/www/talent-assessment-prod
# docker-compose.yml 保持原样（3000/3001/5432/5050）
```

---

## 第五步：配置 Nginx 反向代理

```bash
nano /etc/nginx/sites-available/talent-assessment
```

内容：
```nginx
# 测试环境
server {
    listen 80;
    server_name test.yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

# 生产环境 (HTTP - 稍后升级为HTTPS)
server {
    listen 80;
    server_name yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/talent-assessment /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 第六步：配置域名解析（腾讯云DNS）

登录腾讯云控制台 → 域名管理 → DNS解析：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| @ | A | 你的服务器IP |
| test | A | 你的服务器IP |

等待DNS生效（5-10分钟）

---

## 第七步：启动服务

### 7.1 启动测试环境
```bash
cd /var/www/talent-assessment-test
docker-compose up -d --build
docker-compose logs -f
```

### 7.2 启动生产环境
```bash
cd /var/www/talent-assessment-prod
docker-compose up -d --build
docker-compose logs -f
```

---

## 第八步：配置 HTTPS（Let's Encrypt）

### 8.1 安装 Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 8.2 申请SSL证书
```bash
# 测试环境
certbot --nginx -d test.yourdomain.com

# 生产环境
certbot --nginx -d yourdomain.com
```

Certbot会自动修改Nginx配置，添加HTTPS支持。

### 8.3 更新 `.env` 中的 CORS_ORIGIN
```bash
# 生产环境
cd /var/www/talent-assessment-prod
nano .env
# 修改: CORS_ORIGIN=https://yourdomain.com

# 重启服务
docker-compose restart backend
```

---

## 第九步：配置 Git 自动部署（GitHub Actions）

### 9.1 在项目根目录创建 `.github/workflows/deploy.yml`

```yaml
name: Deploy to Server

on:
  push:
    branches:
      - main  # 生产环境
      - dev   # 测试环境

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            if [ "${{ github.ref }}" == "refs/heads/main" ]; then
              # 生产环境部署
              cd /var/www/talent-assessment-prod
              git pull origin main
              docker-compose down
              docker-compose up -d --build
              echo "✅ 生产环境部署完成"
            elif [ "${{ github.ref }}" == "refs/heads/dev" ]; then
              # 测试环境部署
              cd /var/www/talent-assessment-test
              git pull origin dev
              docker-compose down
              docker-compose up -d --build
              echo "✅ 测试环境部署完成"
            fi
```

### 9.2 配置 GitHub Secrets

1. 登录 GitHub → 你的仓库 → Settings → Secrets and variables → Actions
2. 添加以下 Secrets：
   - `SERVER_IP`: 你的腾讯云服务器IP
   - `SSH_PRIVATE_KEY`: 你的SSH私钥

生成SSH密钥（如果没有）：
```bash
# 在本地电脑执行
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看私钥（复制到GitHub Secrets）
cat ~/.ssh/id_rsa

# 查看公钥（添加到服务器）
cat ~/.ssh/id_rsa.pub
```

在服务器添加公钥：
```bash
# 在服务器执行
nano ~/.ssh/authorized_keys
# 粘贴公钥内容，保存
```

---

## 第十步：日常工作流程

### 开发新功能
```bash
# 1. 切换到dev分支
git checkout dev

# 2. 修改代码
# ...

# 3. 提交并推送
git add .
git commit -m "feat: 新功能描述"
git push origin dev

# 4. GitHub Actions 自动部署到测试环境
# 5. 访问 http://test.yourdomain.com 测试
```

### 发布到生产
```bash
# 1. 测试环境验证通过后，合并到main
git checkout main
git merge dev
git push origin main

# 2. GitHub Actions 自动部署到生产环境
# 3. 访问 https://yourdomain.com 验证
```

---

## 常用命令

### 查看日志
```bash
# 测试环境
cd /var/www/talent-assessment-test
docker-compose logs -f backend

# 生产环境
cd /var/www/talent-assessment-prod
docker-compose logs -f backend
```

### 重启服务
```bash
# 测试环境
cd /var/www/talent-assessment-test
docker-compose restart

# 生产环境
cd /var/www/talent-assessment-prod
docker-compose restart
```

### 查看运行状态
```bash
docker ps
```

### 进入容器调试
```bash
docker exec -it talent_assessment_backend bash
```

---

## 监控和维护

### 磁盘空间监控
```bash
df -h
docker system df
```

### 清理Docker缓存
```bash
docker system prune -a
```

### 数据库备份
```bash
# 测试环境
docker exec talent_assessment_db pg_dump -U admin talent_assessment_test > backup_test_$(date +%Y%m%d).sql

# 生产环境
docker exec talent_assessment_db pg_dump -U admin talent_assessment_prod > backup_prod_$(date +%Y%m%d).sql
```

---

## 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
netstat -tulpn | grep 3000
```

### 数据库连接失败
```bash
# 检查数据库容器状态
docker ps | grep postgres

# 进入数据库容器
docker exec -it talent_assessment_db psql -U admin -d talent_assessment_prod
```

### Nginx配置错误
```bash
# 测试配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

---

## 安全建议

1. **防火墙配置**
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

2. **定期更新系统**
```bash
apt update && apt upgrade -y
```

3. **定期备份数据库**（建议每天自动备份）

4. **监控服务器资源**（CPU、内存、磁盘）

---

## 访问地址总结

| 环境 | 前端地址 | 后端API | 数据库管理 |
|-----|---------|---------|-----------|
| 测试 | http://test.yourdomain.com | http://test.yourdomain.com/api | http://test.yourdomain.com:5051 |
| 生产 | https://yourdomain.com | https://yourdomain.com/api | https://yourdomain.com:5050 |

---

## 下一步

1. 替换文档中的 `yourdomain.com` 为你的真实域名
2. 按照步骤1-8完成服务器配置
3. 按照步骤9配置自动部署
4. 测试完整流程

有问题随时问我！
