# 快速打包说明

## 打包前准备

**在打包发送给其他人之前,请执行以下步骤:**

### 1. 导出最新数据库数据

```bash
docker exec talent_assessment_db pg_dump -U talent_user -d talent_assessment --clean --if-exists > database/backup_with_data.sql
```

### 2. 删除不需要的大文件夹

这些文件夹可以通过 `npm install` 重新生成,不需要包含在压缩包中:

```bash
# Windows (CMD)
rmdir /s /q node_modules
rmdir /s /q frontend\node_modules
rmdir /s /q backend\node_modules
rmdir /s /q backend\uploads

# Mac/Linux
rm -rf node_modules frontend/node_modules backend/node_modules backend/uploads
```

### 3. 删除敏感配置文件

**重要!** 不要分享包含API密钥的文件:

```bash
# Windows
del .env
del backend\.env

# Mac/Linux
rm .env backend/.env
```

### 4. 压缩整个文件夹

- Windows: 右键 -> 发送到 -> 压缩(zipped)文件夹
- Mac: 右键 -> 压缩
- 或使用7-Zip/WinRAR等工具

## 打包后的压缩包应包含

✅ 必须包含:
- `frontend/` (前端代码)
- `backend/` (后端代码)
- `database/` (包含 init.sql 和 backup_with_data.sql)
- `docker-compose.yml`
- `README.md`
- `DEPLOYMENT.md`
- `.env.example`
- `backend/.env.example`

❌ 不应包含:
- `node_modules/` (太大)
- `frontend/node_modules/` (太大)
- `backend/node_modules/` (太大)
- `backend/uploads/` (用户上传的文件)
- `.env` (包含敏感API密钥)
- `backend/.env` (包含敏感配置)

## 接收方需要做什么

接收方解压后需要:

1. 安装Docker Desktop和Node.js
2. 创建 `.env` 和 `backend/.env` 文件(根据示例文件)
3. 启动Docker数据库: `docker-compose up -d postgres pgadmin`
4. 导入数据: `docker exec -i talent_assessment_db psql -U talent_user -d talent_assessment < database/backup_with_data.sql`
5. 安装依赖: `cd backend && npm install` 和 `cd frontend && npm install`
6. 启动服务: `cd backend && npm start` 和 `cd frontend && npm run dev`

详细步骤请查看 `DEPLOYMENT.md` 文件。

---

**提示**: 如果需要定期同步数据,只需要重新导出 `database/backup_with_data.sql` 文件,并发送给接收方导入即可。
