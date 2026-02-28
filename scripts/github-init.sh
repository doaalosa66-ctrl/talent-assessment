#!/bin/bash
# GitHub 初始化脚本 - 在本地电脑执行
# 使用方法: bash scripts/github-init.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 初始化 GitHub 仓库...${NC}"

# 1. 初始化 git（如果还没有）
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Git 仓库初始化完成${NC}"
fi

# 2. 设置默认分支为 main
git branch -M main

# 3. 添加所有文件
git add .

# 4. 首次提交
git commit -m "feat: 初始化项目 - 候选人智能评估与面试辅助系统" 2>/dev/null || echo "已有提交记录，跳过"

# 5. 添加远程仓库
read -p "请输入你的 GitHub 仓库地址 (如: https://github.com/username/repo.git): " repo_url
git remote remove origin 2>/dev/null || true
git remote add origin "$repo_url"

# 6. 推送 main 分支（生产环境）
echo -e "${YELLOW}🚀 推送 main 分支（生产环境）...${NC}"
git push -u origin main

# 7. 创建并推送 dev 分支（测试环境）
echo -e "${YELLOW}🧪 创建并推送 dev 分支（测试环境）...${NC}"
git checkout -b dev 2>/dev/null || git checkout dev
git push -u origin dev

# 8. 切回 main
git checkout main

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ GitHub 仓库初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 下一步：在 GitHub 配置 Secrets${NC}"
echo "1. 打开: $repo_url → Settings → Secrets and variables → Actions"
echo "2. 添加以下两个 Secret:"
echo "   - SERVER_IP: 你的腾讯云服务器IP"
echo "   - SSH_PRIVATE_KEY: 服务器上执行 cat ~/.ssh/id_rsa 获取"
echo ""
echo -e "${YELLOW}📋 日常工作流程:${NC}"
echo "开发新功能 → git checkout dev → 修改代码 → git push origin dev → 自动部署到测试环境"
echo "测试通过   → git checkout main → git merge dev → git push origin main → 自动部署到生产环境"
