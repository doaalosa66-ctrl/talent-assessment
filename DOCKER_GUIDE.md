# Docker 多环境部署指南

本项目使用 Docker 多阶段构建(Multi-stage Build)和构建目标(Build Targets)机制，支持开发环境和生产环境的独立部署。

## 📋 环境区别

### 开发环境 (Development)
- ✅ 支持热重载 (Hot Reload)
- ✅ 包含 devDependencies
- ✅ 挂载源代码卷，实时同步代码变更
- ✅ 后端使用 `node --watch` 自动重启
- ✅ 前端使用 Vite 开发服务器
- ⚠️ 镜像较大（包含所有开发工具）

### 生产环境 (Production)
- ✅ 优化的镜像大小
- ✅ 只包含生产依赖
- ✅ 使用非 root 用户运行（安全性）
- ✅ 包含健康检查机制
- ✅ 后端直接使用 `node` 运行（**禁止 nodemon**）
- ✅ 前端使用 Nginx 服务静态文件
- ✅ Gzip 压缩和缓存优化
- ✅ 自动重启策略

## 🚀 快速开始

### 开发环境

```bash
# 构建并启动开发环境
docker-dev.bat

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 生产环境

```bash
# 构建并启动生产环境
docker-prod.bat

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
```

### 停止所有容器

```bash
docker-stop.bat
```

## 📦 手动构建命令

### 后端

```bash
# 开发环境
docker build --target development -t talent-backend:dev ./backend

# 生产环境
docker build --target production -t talent-backend:prod ./backend
```

### 前端

```bash
# 开发环境
docker build --target development -t talent-frontend:dev ./frontend

# 生产环境
docker build --target production -t talent-frontend:prod ./frontend
```

## 🔍 查看日志

```bash
# 开发环境
docker logs -f talent-backend
docker logs -f talent-frontend

# 生产环境
docker logs -f talent-backend-prod
docker logs -f talent-frontend-prod
```

## 🏗️ Dockerfile 架构说明

### 后端 Dockerfile 结构

```
┌─────────────────────────────────────┐
│  base (node:20)                     │  ← 基础阶段：安装系统依赖
│  - 安装 canvas 编译依赖              │
│  - 复制 package.json                │
└────────┬───────────────┬────────────┘
         │               │
         ▼               ▼
┌──────────────┐  ┌──────────────────┐
│ development  │  │ production-deps  │
│ - 安装所有依赖 │  │ - 只安装生产依赖  │
│ - node --watch│  └────────┬─────────┘
│ - 支持热重载   │           │
└──────────────┘           ▼
                  ┌─────────────────┐
                  │   production    │
                  │ - node:20-slim  │
                  │ - 非 root 用户   │
                  │ - 健康检查       │
                  │ - node 直接运行  │
                  └─────────────────┘
```

### 前端 Dockerfile 结构

```
┌─────────────────────────────────────┐
│  base (node:20-alpine)              │  ← 基础阶段
│  - 复制 package.json                │
└────────┬───────────────┬────────────┘
         │               │
         ▼               ▼
┌──────────────┐  ┌──────────────┐
│ development  │  │   builder    │
│ - Vite 开发   │  │ - vite build │
│ - 热重载      │  └──────┬───────┘
└──────────────┘         │
                         ▼
                ┌─────────────────┐
                │   production    │
                │ - nginx:alpine  │
                │ - 静态文件服务   │
                │ - Gzip 压缩     │
                │ - API 代理      │
                └─────────────────┘
```

## ⚙️ 关键配置

### 生产环境特性

**后端:**
- ❌ **禁止使用 nodemon** - 使用 `node src/index.js` 直接运行
- ✅ 使用 `node:20-slim` 基础镜像（体积更小）
- ✅ 只安装运行时依赖（不包含编译工具）
- ✅ 以非 root 用户 `nodeuser` 运行
- ✅ 健康检查: `http://localhost:3001/api/health`

**前端:**
- ✅ 使用 Nginx 服务静态文件
- ✅ Gzip 压缩和缓存优化
- ✅ SPA 路由支持
- ✅ API 代理到后端
- ✅ 以非 root 用户 `nginx` 运行

## 🔐 环境变量

开发和生产环境使用相同的环境变量，但通过 `NODE_ENV` 区分:

```bash
DEEPSEEK_API_KEY=sk-ced27076f4d447789a2356f1cec68021
DB_HOST=host.docker.internal
DB_PORT=5433
DB_NAME=talent_assessment
DB_USER=talent_user
DB_PASSWORD=talent_password_2024
PORT=3001
NODE_ENV=development  # 或 production
```

## 📊 镜像大小对比

| 镜像 | 开发环境 | 生产环境 | 优化 |
|------|---------|---------|------|
| **后端** | ~2.1GB | ~800MB | 62% ⬇️ |
| **前端** | ~880MB | ~50MB | 94% ⬇️ |

## 🚨 注意事项

1. **生产环境严格禁止 nodemon** - 确保使用 `node` 直接运行
2. **数据库连接** - 使用 `host.docker.internal` 连接宿主机数据库
3. **端口冲突** - 确保 3000 和 3001 端口未被占用
4. **API 密钥** - 生产环境请使用环境变量管理敏感信息
5. **健康检查** - 生产环境容器包含自动健康检查

## 🛠️ 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs talent-backend
docker logs talent-frontend

# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### 数据库连接失败

确保数据库容器正在运行:
```bash
docker ps | findstr postgres
```

### 前端无法访问后端

检查网络连接和容器状态:
```bash
docker network inspect talent-network
docker ps --filter "name=talent"
```

## 📝 最佳实践

1. **开发阶段** - 使用开发环境容器，享受热重载
2. **测试阶段** - 使用生产环境容器，确保与生产一致
3. **部署前** - 验证生产镜像的健康检查和日志
4. **持续集成** - 在 CI/CD 中构建生产镜像并运行测试
5. **镜像管理** - 定期清理未使用的镜像和容器
