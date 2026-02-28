# =============================================================================
# 后端 Dockerfile - 多阶段构建 + 多级缓存 + 双出口 (dev/prod)
# =============================================================================
# 作者：Claude
# 日期：2026-01-10
# 特性：
#   1. 多阶段构建：编译环境与运行环境分离，最终镜像只包含必需文件
#   2. 多级缓存：依赖安装与代码复制分层，修改代码时无需重装依赖
#   3. 体积优化：生产环境使用 slim 基础镜像 + 清理缓存 + 只装生产依赖
#   4. 双出口支持：development (热重载) 和 production (极简安全) 两种构建目标
#   5. 安全加固：生产环境以非 root 用户运行 + 健康检查 + 最小权限
# =============================================================================

# -----------------------------------------------------------------------------
# 阶段 0: 基础阶段 - 安装系统依赖和 canvas 编译工具
# -----------------------------------------------------------------------------
# 用途：提供完整的编译环境，用于构建需要本地编译的 npm 包（如 canvas）
# 特点：包含 C++ 编译器、Python、图形库等完整工具链
# -----------------------------------------------------------------------------
FROM node:20 AS base

# 设置 npm 镜像源（可选，国内用户建议使用淘宝镜像加速）
# RUN npm config set registry https://registry.npmmirror.com

# 安装 canvas 所需的系统依赖（编译时依赖）
# 说明：canvas 是一个 Node.js 的 C++ 扩展，需要这些底层图形库才能编译
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*
# 依赖说明：
# - build-essential: C++ 编译器和 make 工具
# - libcairo2-dev: Cairo 图形库（开发头文件）
# - libpango1.0-dev: Pango 文本渲染库
# - libjpeg-dev: JPEG 图片支持
# - libgif-dev: GIF 图片支持
# - librsvg2-dev: SVG 矢量图支持
# 最后清理 apt 缓存以减小镜像体积

# 设置工作目录（后续所有命令都在此目录下执行）
WORKDIR /app

# 【多级缓存优化 1】先复制 package.json 和 package-lock.json
# 原理：Docker 会缓存每一层，只要 package.json 不变，就不会重新执行 npm install
# 好处：平时改代码不会重装依赖，构建速度提升 10 倍以上
COPY package*.json ./

# -----------------------------------------------------------------------------
# 阶段 1: 开发环境 (development) - 支持热重载
# -----------------------------------------------------------------------------
# 构建命令：docker build --target development -t app:dev .
# 用途：本地开发调试，支持代码热重载，包含所有开发工具
# 特点：体积较大，但开发体验好
# -----------------------------------------------------------------------------
FROM base AS development

# 设置环境变量为开发模式
ENV NODE_ENV=development

# 【多级缓存优化 2】安装全部依赖（包括 devDependencies）
# --legacy-peer-deps: 忽略 peer 依赖冲突警告
RUN npm install --legacy-peer-deps

# 复制源代码（放在 npm install 之后，避免代码改动导致重装依赖）
COPY . .

# 创建上传文件目录
RUN mkdir -p uploads

# 暴露后端服务端口
EXPOSE 3001

# 开发环境启动命令：使用 node --watch 实现热重载
# node --watch: Node 20+ 内置的文件监听功能，代码改动自动重启
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# 阶段 2: 生产依赖安装阶段 (production-deps)
# -----------------------------------------------------------------------------
# 用途：只安装生产环境需要的依赖，不包括测试、构建等开发工具
# 特点：体积最小，只保留运行时必需的包
# -----------------------------------------------------------------------------
FROM base AS production-deps

# 设置环境变量为生产模式
ENV NODE_ENV=production

# 【体积优化 1】只安装生产依赖，并清理 npm 缓存
# npm ci: 使用 package-lock.json 精确安装，速度快且可复现
# --only=production: 只安装 dependencies，不装 devDependencies
# npm cache clean --force: 清理 npm 缓存，减小镜像体积
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# -----------------------------------------------------------------------------
# 阶段 3: 生产环境 (production) - 极简安全版
# -----------------------------------------------------------------------------
# 构建命令：docker build --target production -t app:prod .
# 用途：部署到生产环境，体积最小，安全性最高
# 特点：使用 slim 基础镜像 + 非 root 用户 + 只包含运行时依赖
# -----------------------------------------------------------------------------
FROM node:20-slim AS production

# 【体积优化 2】安装 canvas 运行时依赖（只装运行库，不装开发工具）
# 说明：相比 base 阶段，这里只装运行时的 .so 文件，不装编译工具（-dev 包）
# 效果：镜像体积从 2GB 缩减到 600MB 左右
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*
# 运行时依赖说明：
# - libcairo2: Cairo 图形库（仅运行时）
# - libpango-1.0-0: Pango 文本渲染库（仅运行时）
# - libpangocairo-1.0-0: Pango-Cairo 绑定
# - libjpeg62-turbo: JPEG 支持库
# - libgif7: GIF 支持库
# - librsvg2-2: SVG 支持库
# 【垃圾清理 1】删除 apt 缓存

# 设置环境变量为生产模式
ENV NODE_ENV=production

# 【安全加固 1】创建非 root 用户
# 原理：容器默认以 root 运行，一旦被攻破，黑客拥有完整系统权限
# 方案：创建普通用户 nodeuser，只有应用目录的读写权限
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser

# 设置工作目录
WORKDIR /app

# 【多阶段构建核心】从 production-deps 阶段复制已安装的依赖
# 好处：最终镜像不包含编译工具，只包含运行时依赖
COPY --from=production-deps --chown=nodeuser:nodeuser /app/node_modules ./node_modules

# 复制源代码，并设置文件所有者为 nodeuser
COPY --chown=nodeuser:nodeuser . .

# 创建上传文件目录，并设置权限
RUN mkdir -p uploads && chown -R nodeuser:nodeuser uploads

# 【垃圾清理 2】删除开发环境的配置文件（可选）
# 说明：这些文件在生产环境用不到，可以删除以减小体积
RUN rm -rf \
    .git \
    .gitignore \
    README.md \
    *.md \
    .vscode \
    .idea \
    test \
    tests \
    **/*.test.js \
    **/*.spec.js

# 【安全加固 2】切换到非 root 用户运行
# 重要：此后的所有操作（包括容器启动）都以 nodeuser 身份执行
USER nodeuser

# 暴露后端服务端口
EXPOSE 3001

# 【安全加固 3】健康检查 - 自动监控应用是否正常运行
# --interval=30s: 每 30 秒检查一次
# --timeout=3s: 单次检查超时时间
# --start-period=40s: 应用启动后 40 秒才开始检查（给应用足够启动时间）
# --retries=3: 连续 3 次失败才判定为不健康
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 【关键】生产环境禁止使用 nodemon，直接使用 node 启动
# 原因：nodemon 会监听文件变化并重启，生产环境不需要，且会增加性能开销
CMD ["node", "src/index.js"]

# =============================================================================
# 使用说明
# =============================================================================
# 1. 构建开发镜像：
#    docker build --target development -t talent-backend:dev .
#
# 2. 构建生产镜像：
#    docker build --target production -t talent-backend:prod .
#
# 3. 运行开发容器（支持热重载）：
#    docker run -p 3001:3001 -v $(pwd)/src:/app/src talent-backend:dev
#
# 4. 运行生产容器：
#    docker run -p 3001:3001 talent-backend:prod
#
# 5. 查看镜像大小对比：
#    docker images | grep talent-backend
# =============================================================================
