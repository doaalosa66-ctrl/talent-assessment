# 系统部署指南

本文档帮助您将代码和数据库完整地迁移到其他电脑。

## 📦 打包准备清单

在打包发送给其他人之前,确保包含以下内容:

### ✅ 必须包含的文件和文件夹

```
候选人智能评估与面试辅助系统/
├── frontend/              # 前端代码(必须)
│   ├── src/              # 源代码
│   ├── public/           # 静态资源
│   └── package.json      # 依赖配置
├── backend/              # 后端代码(必须)
│   ├── src/              # 源代码
│   └── package.json      # 依赖配置
├── database/             # 数据库文件(必须)
│   ├── init.sql         # 初始表结构
│   └── backup_with_data.sql  # 完整数据备份(包含历史岗位等)
├── docker-compose.yml    # Docker编排配置(必须)
├── README.md            # 使用说明
├── DEPLOYMENT.md        # 本部署指南
├── .env.example         # 环境变量示例
└── backend/.env.example # 后端环境变量示例
```

### ❌ 不要包含的文件和文件夹

这些文件夹会让压缩包非常大,且可以通过 `npm install` 重新生成:

```
❌ node_modules/         # 删除(可重新安装)
❌ frontend/node_modules/ # 删除(可重新安装)
❌ backend/node_modules/  # 删除(可重新安装)
❌ backend/uploads/       # 删除(可选,包含上传的简历文件)
❌ .env                  # 删除(包含敏感API密钥)
❌ backend/.env          # 删除(包含敏感配置)
```

## 📋 打包步骤

### Windows系统

```bash
# 1. 删除node_modules(释放空间)
cd "c:\Users\offic\Desktop\内部研产销各个环节AI工具（初版）\1、候选人智能评估与面试辅助系统"
rmdir /s /q node_modules
rmdir /s /q frontend\node_modules
rmdir /s /q backend\node_modules

# 2. 删除上传文件(可选)
rmdir /s /q backend\uploads

# 3. 导出最新数据库数据(重要!)
docker exec talent_assessment_db pg_dump -U talent_user -d talent_assessment --clean --if-exists > database\backup_with_data.sql

# 4. 压缩整个文件夹
# 使用Windows资源管理器右键 -> 发送到 -> 压缩(zipped)文件夹
# 或使用7-Zip/WinRAR等工具
```

### Mac/Linux系统

```bash
# 1. 导出最新数据库数据
docker exec talent_assessment_db pg_dump -U talent_user -d talent_assessment --clean --if-exists > database/backup_with_data.sql

# 2. 打包(自动排除node_modules)
tar -czf talent-assessment-system.tar.gz \
  --exclude="node_modules" \
  --exclude="backend/uploads" \
  --exclude=".env" \
  --exclude="backend/.env" \
  候选人智能评估与面试辅助系统/
```

## 🚀 接收方部署步骤

### 前置要求

接收方电脑需要安装:

1. **Docker Desktop** (推荐) - https://www.docker.com/products/docker-desktop
2. **Node.js 20.x** - https://nodejs.org/
3. **Git** (可选) - https://git-scm.com/

### 步骤 1: 解压文件

将收到的压缩包解压到任意目录,例如:
- Windows: `C:\Projects\talent-assessment-system`
- Mac/Linux: `~/projects/talent-assessment-system`

### 步骤 2: 创建环境变量文件

#### 2.1 根目录的 `.env` 文件

在项目根目录创建 `.env` 文件:

```bash
# 复制示例文件
cp .env.example .env
```

编辑 `.env`,填写DeepSeek API密钥:

```env
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

#### 2.2 后端的 `.env` 文件

在 `backend/` 目录创建 `.env` 文件:

```bash
# 进入backend目录
cd backend

# 复制示例文件
cp .env.example .env
```

编辑 `backend/.env`:

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5433
DB_NAME=talent_assessment
DB_USER=talent_user
DB_PASSWORD=talent_password_2024
DB_POOL_MIN=2
DB_POOL_MAX=10

# 服务端口
PORT=3001

# DeepSeek API配置
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# CORS配置
CORS_ORIGIN=http://localhost:3000

# 文件上传配置
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

### 步骤 3: 启动Docker Desktop

确保Docker Desktop已启动并运行。

### 步骤 4: 启动PostgreSQL数据库

在项目根目录执行:

```bash
# Windows (PowerShell或CMD)
docker-compose up -d postgres pgadmin

# Mac/Linux
docker-compose up -d postgres pgadmin
```

等待数据库容器启动(约10-15秒)。

### 步骤 5: 导入数据库数据

**重要!** 执行此步骤将导入发送方的所有历史数据(岗位历史、公司背景等):

#### Windows (CMD)

```bash
# 等待数据库完全启动
timeout /t 10

# 导入数据
docker exec -i talent_assessment_db psql -U talent_user -d talent_assessment < database\backup_with_data.sql
```

#### Mac/Linux

```bash
# 等待数据库完全启动
sleep 10

# 导入数据
docker exec -i talent_assessment_db psql -U talent_user -d talent_assessment < database/backup_with_data.sql
```

### 步骤 6: 安装依赖并启动服务

#### 后端

```bash
# 进入backend目录
cd backend

# 安装依赖(可能需要5-10分钟)
npm install

# 启动后端服务
npm start
```

后端应显示:
```
✅ 后端服务已启动: http://localhost:3001
✅ 数据库连接成功
```

#### 前端

打开新的命令行窗口:

```bash
# 进入frontend目录
cd frontend

# 安装依赖(可能需要5-10分钟)
npm install

# 启动前端服务
npm run dev
```

前端应显示:
```
➜  Local:   http://localhost:3000/
```

### 步骤 7: 验证部署

1. 打开浏览器访问 http://localhost:3000
2. 检查页面是否正常加载
3. 查看"历史岗位"下拉框是否有数据(如果有历史数据)
4. 尝试创建一个测试任务

### 步骤 8: 访问数据库管理工具(可选)

pgAdmin已随数据库一起启动:

- URL: http://localhost:5050
- 邮箱: admin@talent.com
- 密码: admin123

连接数据库配置:
- Host: postgres (Docker内部) 或 localhost (外部访问)
- Port: 5432 (Docker内部) 或 5433 (外部访问)
- Database: talent_assessment
- Username: talent_user
- Password: talent_password_2024

## 🔍 验证数据导入

连接数据库后,执行以下SQL查询验证数据:

```sql
-- 查看岗位历史数量
SELECT COUNT(*) as job_count FROM job_positions;

-- 查看岗位列表
SELECT id, job_title, created_at FROM job_positions ORDER BY created_at DESC;

-- 查看公司背景数量
SELECT COUNT(*) as bg_count FROM company_backgrounds;

-- 查看评估报告数量
SELECT COUNT(*) as report_count FROM assessment_reports;
```

## 🛠️ 常见问题

### Q1: 端口被占用怎么办?

**查看哪个程序占用了端口:**

Windows:
```bash
netstat -ano | findstr "3000"
netstat -ano | findstr "3001"
netstat -ano | findstr "5433"
```

Mac/Linux:
```bash
lsof -i :3000
lsof -i :3001
lsof -i :5433
```

**解决方法:**

1. 关闭占用端口的程序
2. 或者修改配置使用其他端口

### Q2: Docker容器启动失败?

**检查Docker状态:**

```bash
# 查看所有容器
docker ps -a

# 查看容器日志
docker-compose logs postgres

# 重启容器
docker-compose restart postgres
```

**常见原因:**
- Docker Desktop未启动
- 端口5433已被占用
- 磁盘空间不足

### Q3: 数据导入失败?

**可能原因:**

1. 数据库容器未完全启动(等待更久再执行导入)
2. SQL文件路径错误(检查文件是否存在)
3. 权限问题(使用管理员权限运行命令)

**手动导入方法:**

```bash
# 复制SQL文件到容器
docker cp database/backup_with_data.sql talent_assessment_db:/tmp/

# 进入容器执行导入
docker exec -it talent_assessment_db bash
psql -U talent_user -d talent_assessment -f /tmp/backup_with_data.sql
exit
```

### Q4: npm install 失败?

**可能原因:**
- 网络问题
- Node.js版本不匹配
- npm缓存问题

**解决方法:**

```bash
# 清除npm缓存
npm cache clean --force

# 使用淘宝镜像(中国用户)
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

### Q5: 前端无法连接后端?

**检查清单:**
1. 后端服务是否在运行?(http://localhost:3001)
2. 浏览器控制台是否有CORS错误?
3. backend/.env 的 CORS_ORIGIN 是否正确?

## 📊 系统架构图

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   React+Vite    │────────▶│  Node.js+Express│
│  localhost:3000 │  HTTP   │  localhost:3001 │
└─────────────────┘         └─────────────────┘
                                     │
                                     │ SQL
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   Docker容器    │
                            │  localhost:5433 │
                            └─────────────────┘
                                     │
                                     │ 管理
                                     ▼
                            ┌─────────────────┐
                            │     pgAdmin     │
                            │  localhost:5050 │
                            └─────────────────┘
```

## 🔒 安全提示

1. **不要分享包含.env文件的压缩包** - API密钥会泄露
2. **使用强密码** - 修改数据库默认密码
3. **限制访问** - 生产环境使用防火墙限制数据库访问
4. **定期备份** - 定期导出数据库备份

## 📞 技术支持

如遇到问题,请提供以下信息:

1. 操作系统版本
2. Docker版本 (`docker --version`)
3. Node.js版本 (`node --version`)
4. 错误日志截图
5. 具体的错误信息

---

**部署成功后,请删除此文档或妥善保管,因为包含敏感配置信息!**
