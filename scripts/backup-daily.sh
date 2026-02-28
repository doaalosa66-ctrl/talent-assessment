#!/bin/bash
set -e

# 配置
BACKUP_DIR="./backups/daily"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"
CONTAINER_NAME="talent_assessment_db"
DB_USER="talent_user"
DB_NAME="talent_assessment"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "开始备份数据库..."
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

# 验证备份
if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "错误: 备份验证失败 - $BACKUP_FILE"
  exit 1
fi

echo "备份成功: $BACKUP_FILE"

# 保留最近7天的备份
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "备份完成，已清理旧备份"
