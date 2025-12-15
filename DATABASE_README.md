# 路之音智能人才评估系统 - 数据库配置指南

## 📊 数据库架构

本系统使用 **PostgreSQL 16** 作为数据库,通过 Docker Compose 进行部署。

### 数据表结构

1. **company_backgrounds** - 公司背景表
   - 存储公司背景信息
   - 支持历史记录和当前激活状态

2. **job_positions** - 岗位信息表
   - 存储岗位名称和JD要求
   - 关联公司背景
   - 支持历史记录查询

3. **assessment_reports** - 评估报告主表
   - 存储每次评估的整体信息
   - 包含岗位快照数据

4. **candidate_resumes** - 候选人简历表
   - 存储候选人简历内容
   - 存储AI评估结果(分数、推荐等级等)
   - 支持JSONB格式的详细评估数据

5. **assessment_history** - 评估历史记录表
   - 快速查询评估历史列表

## 🚀 快速开始

### 1. 启动 Docker 数据库

```bash
# 在项目根目录执行
docker-compose up -d
```

这将启动:
- **PostgreSQL** 数据库 (端口: 5432)
- **pgAdmin** 管理工具 (端口: 5050)

### 2. 访问 pgAdmin 管理界面

访问: http://localhost:5050

**登录凭证:**
- 邮箱: `admin@talent.com`
- 密码: `admin123`

**添加服务器连接:**
1. 点击 "Add New Server"
2. General标签页:
   - Name: `TalentDB`
3. Connection标签页:
   - Host: `postgres` (或 `localhost`)
   - Port: `5432`
   - Database: `talent_assessment`
   - Username: `talent_user`
   - Password: `talent_password_2024`

### 3. 配置后端环境变量

复制 `.env.example` 为 `.env`:

```bash
cd backend
copy .env.example .env  # Windows
# 或
cp .env.example .env    # Linux/Mac
```

确认 `.env` 中的数据库配置:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talent_assessment
DB_USER=talent_user
DB_PASSWORD=talent_password_2024
```

### 4. 启动服务

```bash
# 启动后端 (在backend目录)
npm start

# 启动前端 (在frontend目录)
npm run dev
```

## 📋 数据库操作说明

### 自动初始化

数据库会在第一次启动时自动执行 `database/init.sql` 脚本,创建所有必要的表和索引。

### 手动重置数据库

如果需要重置数据库:

```bash
# 停止并删除容器和数据
docker-compose down -v

# 重新启动
docker-compose up -d
```

### 查看数据库日志

```bash
docker-compose logs postgres
```

## 🔧 API端点

系统提供以下数据库相关API:

### 公司背景
- `GET /api/data/company-background` - 获取当前激活的公司背景
- `POST /api/data/company-background` - 保存公司背景
- `GET /api/data/company-background/history` - 获取公司背景历史

### 岗位信息
- `GET /api/data/job-positions` - 获取岗位历史列表
- `POST /api/data/job-positions` - 创建或更新岗位
- `GET /api/data/job-positions/:id` - 获取岗位详情
- `GET /api/data/job-positions/search/:term` - 搜索岗位

### 评估报告
- `POST /api/data/assessment-reports` - 保存完整评估报告
- `GET /api/data/assessment-reports/:id` - 获取评估报告详情
- `GET /api/data/assessment-history` - 获取评估历史列表

### 健康检查
- `GET /api/data/health` - 检查数据库连接状态

## 📊 数据持久化

- 数据存储在 Docker Volume: `postgres_data`
- pgAdmin 配置存储在: `pgadmin_data`
- 数据在容器重启后会保留
- 只有执行 `docker-compose down -v` 才会删除数据

## 🔒 安全建议

**生产环境部署时,请修改以下默认值:**

1. 数据库密码 (`docker-compose.yml` 和 `.env`)
2. pgAdmin 登录凭证 (`docker-compose.yml`)
3. 启用SSL连接
4. 配置防火墙规则
5. 定期备份数据库

## 🛠️ 常见问题

### Q: 端口 5432 已被占用怎么办?

A: 修改 `docker-compose.yml` 中的端口映射:
```yaml
ports:
  - "5433:5432"  # 改为其他端口
```

同时修改 `.env` 中的 `DB_PORT=5433`

### Q: 如何备份数据库?

A: 使用以下命令:
```bash
docker exec talent_assessment_db pg_dump -U talent_user talent_assessment > backup.sql
```

### Q: 如何恢复数据库?

A: 使用以下命令:
```bash
docker exec -i talent_assessment_db psql -U talent_user talent_assessment < backup.sql
```

### Q: 后端提示数据库连接失败?

A: 检查以下几点:
1. Docker容器是否正常运行: `docker ps`
2. 数据库密码是否正确
3. 防火墙是否阻止了5432端口
4. 查看数据库日志: `docker-compose logs postgres`

## 📚 更多资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [pgAdmin 文档](https://www.pgadmin.org/docs/)
