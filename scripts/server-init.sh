#!/bin/bash
# 服务器初始化脚本 - lumina.中国 双环境部署
# 使用方法：将此脚本上传到服务器后执行 bash server-init.sh

set -e

echo "🚀 开始初始化服务器..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 更新系统
echo -e "${YELLOW}📦 更新系统包...${NC}"
apt update && apt upgrade -y

# 2. 安装 Docker
echo -e "${YELLOW}🐳 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✅ Docker 安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker 已安装${NC}"
fi

# 3. 安装 Docker Compose
echo -e "${YELLOW}🐳 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose 安装完成${NC}"
else
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
fi

# 4. 安装 Git
echo -e "${YELLOW}📚 安装 Git...${NC}"
if ! command -v git &> /dev/null; then
    apt install git -y
    echo -e "${GREEN}✅ Git 安装完成${NC}"
else
    echo -e "${GREEN}✅ Git 已安装${NC}"
fi

# 5. 安装 Nginx
echo -e "${YELLOW}🌐 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✅ Nginx 安装完成${NC}"
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
fi

# 6. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo -e "${GREEN}✅ 防火墙配置完成${NC}"

# 7. 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p /var/www/talent-assessment-test
mkdir -p /var/www/talent-assessment-prod
mkdir -p /root/envs
echo -e "${GREEN}✅ 项目目录创建完成${NC}"

# 8. 配置 Git（需要用户输入）
echo -e "${YELLOW}📝 配置 Git...${NC}"
read -p "请输入你的 GitHub 用户名: " github_username
read -p "请输入你的 GitHub 邮箱: " github_email
git config --global user.name "$github_username"
git config --global user.email "$github_email"
echo -e "${GREEN}✅ Git 配置完成${NC}"

# 9. 生成 SSH 密钥（用于 GitHub）
echo -e "${YELLOW}🔑 生成 SSH 密钥...${NC}"
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "$github_email" -f ~/.ssh/id_rsa -N ""
    echo -e "${GREEN}✅ SSH 密钥生成完成${NC}"
    echo -e "${YELLOW}📋 请将以下公钥添加到 GitHub (Settings → SSH and GPG keys):${NC}"
    cat ~/.ssh/id_rsa.pub
    echo ""
    read -p "按回车键继续..."
else
    echo -e "${GREEN}✅ SSH 密钥已存在${NC}"
fi

# 10. 克隆代码仓库
echo -e "${YELLOW}📥 克隆代码仓库...${NC}"
read -p "请输入你的 GitHub 仓库地址 (如: git@github.com:username/repo.git): " repo_url

# 克隆测试环境（dev分支）
if [ ! -d "/var/www/talent-assessment-test/.git" ]; then
    cd /var/www/talent-assessment-test
    git clone -b dev "$repo_url" .
    echo -e "${GREEN}✅ 测试环境代码克隆完成${NC}"
else
    echo -e "${YELLOW}⚠️  测试环境代码已存在，跳过克隆${NC}"
fi

# 克隆生产环境（main分支）
if [ ! -d "/var/www/talent-assessment-prod/.git" ]; then
    cd /var/www/talent-assessment-prod
    git clone -b main "$repo_url" .
    echo -e "${GREEN}✅ 生产环境代码克隆完成${NC}"
else
    echo -e "${YELLOW}⚠️  生产环境代码已存在，跳过克隆${NC}"
fi

# 11. 创建环境变量文件
echo -e "${YELLOW}📝 创建环境变量文件...${NC}"

# 测试环境 .env
cat > /root/envs/.env.test << 'EOF'
PORT=3101
NODE_ENV=development

DEEPSEEK_API_KEY=sk-631d60b3ce3f4315b624ad75038ba0c8

JWT_SECRET=xRLqXg3dAhhpnBqdB/rg/UnWRG/EAZLh7bklFVvw7/24bW3AUvT39qvrgzRll0U5
JWT_EXPIRES_IN=24h

DB_HOST=postgres_test
DB_PORT=5432
DB_NAME=talent_assessment_test
DB_USER=admin
DB_PASSWORD=67b4f4103b25201507ac37acf86a9898
DB_POOL_MIN=2
DB_POOL_MAX=10

CORS_ORIGIN=http://test.lumina.xn--fiqs8s

LOG_LEVEL=debug
LOG_DIR=./logs

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

PGADMIN_EMAIL=admin@talent.com
PGADMIN_PASSWORD=857ca84b84870a1a15f1fb355ec4f119
EOF

# 生产环境 .env
cat > /root/envs/.env.prod << 'EOF'
PORT=3001
NODE_ENV=production

DEEPSEEK_API_KEY=sk-631d60b3ce3f4315b624ad75038ba0c8

JWT_SECRET=xRLqXg3dAhhpnBqdB/rg/UnWRG/EAZLh7bklFVvw7/24bW3AUvT39qvrgzRll0U5
JWT_EXPIRES_IN=24h

DB_HOST=postgres
DB_PORT=5432
DB_NAME=talent_assessment
DB_USER=admin
DB_PASSWORD=67b4f4103b25201507ac37acf86a9898
DB_POOL_MIN=2
DB_POOL_MAX=10

CORS_ORIGIN=https://lumina.xn--fiqs8s

LOG_LEVEL=info
LOG_DIR=./logs

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

PGADMIN_EMAIL=admin@talent.com
PGADMIN_PASSWORD=857ca84b84870a1a15f1fb355ec4f119
EOF

# 复制环境变量文件到项目目录
cp /root/envs/.env.test /var/www/talent-assessment-test/.env
cp /root/envs/.env.prod /var/www/talent-assessment-prod/.env

echo -e "${GREEN}✅ 环境变量文件创建完成${NC}"

# 12. 配置 Nginx
echo -e "${YELLOW}🌐 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/talent-assessment << 'EOF'
# 测试环境
server {
    listen 80;
    server_name test.lumina.xn--fiqs8s;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    location /ws {
        proxy_pass http://localhost:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

# 生产环境
server {
    listen 80;
    server_name lumina.xn--fiqs8s www.lumina.xn--fiqs8s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

ln -sf /etc/nginx/sites-available/talent-assessment /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx 配置完成${NC}"

# 13. 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"

# 启动测试环境
cd /var/www/talent-assessment-test
docker-compose -f docker-compose.test.yml --env-file .env up -d --build
echo -e "${GREEN}✅ 测试环境启动完成${NC}"

# 启动生产环境
cd /var/www/talent-assessment-prod
docker-compose up -d --build
echo -e "${GREEN}✅ 生产环境启动完成${NC}"

# 14. 安装 Certbot（SSL证书）
echo -e "${YELLOW}🔒 安装 Certbot...${NC}"
apt install certbot python3-certbot-nginx -y
echo -e "${GREEN}✅ Certbot 安装完成${NC}"

# 15. 申请 SSL 证书
echo -e "${YELLOW}🔒 申请 SSL 证书...${NC}"
echo -e "${YELLOW}⚠️  请确保域名已解析到本服务器IP${NC}"
read -p "是否现在申请SSL证书？(y/n): " apply_ssl

if [ "$apply_ssl" = "y" ]; then
    certbot --nginx -d test.lumina.xn--fiqs8s
    certbot --nginx -d lumina.xn--fiqs8s -d www.lumina.xn--fiqs8s

    # 更新生产环境 CORS_ORIGIN
    sed -i 's|CORS_ORIGIN=http://|CORS_ORIGIN=https://|g' /root/envs/.env.prod
    cp /root/envs/.env.prod /var/www/talent-assessment-prod/.env
    cd /var/www/talent-assessment-prod
    docker-compose restart backend

    echo -e "${GREEN}✅ SSL 证书申请完成${NC}"
else
    echo -e "${YELLOW}⚠️  跳过 SSL 证书申请，稍后可手动执行:${NC}"
    echo "certbot --nginx -d test.lumina.xn--fiqs8s"
    echo "certbot --nginx -d lumina.xn--fiqs8s -d www.lumina.xn--fiqs8s"
fi

# 16. 显示总结信息
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 服务器初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 访问地址:${NC}"
echo "测试环境: http://test.lumina.xn--fiqs8s"
echo "生产环境: http://lumina.xn--fiqs8s"
echo ""
echo -e "${YELLOW}📋 数据库管理:${NC}"
echo "测试环境 pgAdmin: http://your-server-ip:5051"
echo "生产环境 pgAdmin: http://your-server-ip:5050"
echo "登录邮箱: admin@talent.com"
echo "登录密码: 857ca84b84870a1a15f1fb355ec4f119"
echo ""
echo -e "${YELLOW}📋 常用命令:${NC}"
echo "查看测试环境日志: cd /var/www/talent-assessment-test && docker-compose -f docker-compose.test.yml logs -f"
echo "查看生产环境日志: cd /var/www/talent-assessment-prod && docker-compose logs -f"
echo "重启测试环境: cd /var/www/talent-assessment-test && docker-compose -f docker-compose.test.yml restart"
echo "重启生产环境: cd /var/www/talent-assessment-prod && docker-compose restart"
echo ""
echo -e "${YELLOW}📋 下一步:${NC}"
echo "1. 在腾讯云DNS添加域名解析:"
echo "   - 主机记录: @, 记录类型: A, 记录值: $(curl -s ifconfig.me)"
echo "   - 主机记录: test, 记录类型: A, 记录值: $(curl -s ifconfig.me)"
echo "2. 等待DNS生效后，重新运行 SSL 证书申请"
echo "3. 在 GitHub 仓库设置 Secrets (Settings → Secrets):"
echo "   - SERVER_IP: $(curl -s ifconfig.me)"
echo "   - SSH_PRIVATE_KEY: (运行 cat ~/.ssh/id_rsa 获取)"
echo ""
echo -e "${GREEN}✅ 初始化完成！${NC}"
