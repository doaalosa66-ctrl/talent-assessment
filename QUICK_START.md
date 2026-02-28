# 快速部署指南 - lumina.中国

## 准备工作清单

- [x] 腾讯云服务器（已登录，Docker已安装）
- [x] 域名：lumina.中国
- [ ] GitHub 账号
- [ ] 完成以下步骤

---

## 第一步：推送代码到 GitHub

### 1.1 在 GitHub 创建仓库

1. 打开 https://github.com/new
2. 仓库名填：`talent-assessment`
3. 选择 **Private**（私有，保护代码安全）
4. 点击 **Create repository**

### 1.2 在本地推送代码

打开本地终端，进入项目目录执行：

```bash
cd "c:\Users\Administrator\Desktop\1、候选人智能评估与面试辅助系统"

# 初始化 git
git init
git branch -M main

# 添加所有文件
git add .
git commit -m "feat: 初始化项目"

# 连接 GitHub（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/talent-assessment.git

# 推送 main 分支（生产环境）
git push -u origin main

# 创建并推送 dev 分支（测试环境）
git checkout -b dev
git push -u origin dev

# 切回 main
git checkout main
```

---

## 第二步：配置服务器

### 2.1 上传初始化脚本到服务器

在本地终端执行：
```bash
scp "c:\Users\Administrator\Desktop\1、候选人智能评估与面试辅助系统\scripts\server-init.sh" root@你的服务器IP:/root/
```

### 2.2 登录服务器并执行初始化

```bash
ssh root@你的服务器IP
chmod +x /root/server-init.sh
bash /root/server-init.sh
```

脚本会自动完成：
- 安装 Nginx、Git、Certbot
- 配置防火墙
- 克隆代码仓库
- 创建环境变量文件
- 配置 Nginx
- 启动 Docker 服务

---

## 第三步：配置域名解析

登录腾讯云控制台 → DNS解析 → 添加记录：

| 主机记录 | 记录类型 | 记录值 |
|---------|---------|--------|
| @ | A | 你的服务器IP |
| test | A | 你的服务器IP |
| www | A | 你的服务器IP |

等待 5-10 分钟 DNS 生效。

---

## 第四步：申请 SSL 证书

DNS 生效后，在服务器执行：

```bash
# 测试环境
certbot --nginx -d test.lumina.xn--fiqs8s

# 生产环境
certbot --nginx -d lumina.xn--fiqs8s -d www.lumina.xn--fiqs8s

# 更新生产环境 CORS 为 https
sed -i 's|CORS_ORIGIN=http://lumina|CORS_ORIGIN=https://lumina|g' /root/envs/.env.prod
cp /root/envs/.env.prod /var/www/talent-assessment-prod/.env
cd /var/www/talent-assessment-prod && docker-compose restart backend
```

---

## 第五步：配置 GitHub 自动部署

### 5.1 获取服务器 SSH 私钥

在服务器执行：
```bash
cat ~/.ssh/id_rsa
```
复制全部输出内容（包括 `-----BEGIN...` 和 `-----END...`）

### 5.2 在 GitHub 添加 Secrets

打开：你的仓库 → Settings → Secrets and variables → Actions → New repository secret

添加两个 Secret：

| Name | Value |
|------|-------|
| `SERVER_IP` | 你的腾讯云服务器IP |
| `SSH_PRIVATE_KEY` | 上一步复制的私钥内容 |

### 5.3 验证自动部署

```bash
# 本地修改任意文件，推送到 dev 分支
git checkout dev
git add .
git commit -m "test: 测试自动部署"
git push origin dev

# 查看 GitHub Actions 执行情况
# 打开：你的仓库 → Actions
```

---

## 日常工作流程

```
开发新功能
    ↓
git checkout dev
    ↓
修改代码
    ↓
git push origin dev
    ↓
自动部署到 test.lumina.中国（测试）
    ↓
测试通过
    ↓
git checkout main
git merge dev
git push origin main
    ↓
自动部署到 lumina.中国（生产）
```

---

## 访问地址

| 环境 | 地址 |
|-----|------|
| 生产环境 | https://lumina.xn--fiqs8s |
| 测试环境 | http://test.lumina.xn--fiqs8s |
| 生产 pgAdmin | http://你的服务器IP:5050 |
| 测试 pgAdmin | http://你的服务器IP:5051 |

pgAdmin 登录：
- 邮箱：`admin@talent.com`
- 密码：`857ca84b84870a1a15f1fb355ec4f119`

---

## 常用运维命令

```bash
# 查看所有容器状态
docker ps

# 查看生产环境日志
cd /var/www/talent-assessment-prod
docker-compose logs -f backend

# 查看测试环境日志
cd /var/www/talent-assessment-test
docker-compose -f docker-compose.test.yml logs -f backend_test

# 重启生产环境
cd /var/www/talent-assessment-prod
docker-compose restart

# 重启测试环境
cd /var/www/talent-assessment-test
docker-compose -f docker-compose.test.yml restart

# 手动更新生产环境（不用 GitHub Actions 时）
cd /var/www/talent-assessment-prod
git pull origin main
docker-compose down && docker-compose up -d --build

# 手动更新测试环境
cd /var/www/talent-assessment-test
git pull origin dev
docker-compose -f docker-compose.test.yml down
docker-compose -f docker-compose.test.yml --env-file .env up -d --build
```
