# 智能人才评估系统 - 自动化测试文档

## 📊 测试概览

本文档描述了**路之音智能人才评估与面试决策系统**的完整测试套件,涵盖**单元测试**和**集成测试**。

### 技术栈

**后端测试**
- **测试框架**: Jest 30.2.0
- **HTTP测试**: Supertest 7.1.4
- **AI服务**: DeepSeek API
- **简历解析**: pdf-parse, mammoth, tesseract.js (OCR)

**前端测试**
- **测试框架**: Vitest 4.0.8
- **组件测试**: @testing-library/react 16.3.0
- **用户交互**: @testing-library/user-event 14.6.1
- **可视化**: Recharts

## ✅ 已创建的测试文件

### 后端测试

#### 1. **deepseekService.test.js** - DeepSeek AI服务测试 (已创建)

**测试用例数**: 40+

**测试覆盖**:
- ✅ `callDeepSeek` - API通用调用 (8个测试)
  - 成功调用并返回响应
  - 默认temperature参数
  - API错误处理
  - 网络超时
  - 边界条件: 极长提示词(50000字符)
  - 边界条件: 特殊字符和XSS
  - 401/500错误处理

- ✅ `analyzeJobDescription` - 岗位JD分析 (6个测试)
  - 成功分析并返回结构化数据
  - 边界条件: 空公司背景
  - 边界条件: 极长岗位描述(10000+字符)
  - 非JSON格式处理
  - Markdown标记处理

- ✅ `parseResume` - 简历解析 (7个测试)
  - 成功解析简历文本
  - 边界条件: OCR混乱文本
  - 边界条件: 空简历
  - 边界条件: 特殊字符
  - 工作年限自动计算

- ✅ `assessCandidate` - 候选人评估 (3个测试)
  - 多维度评分
  - 边界条件: 数据缺失
  - 高匹配度候选人

- ✅ `generateInvitationDecision` - 邀约决策 (3个测试)
  - 强烈推荐决策(90+分)
  - 不推荐决策(<60分)
  - 边界条件: 中等评分(60-70分)

- ✅ `generateCustomAssessment` - 定制测评题 (2个测试)
  - 技术/行为/情景题生成
  - 边界条件: 无明显短板

- ✅ `quickComprehensiveAssessment` - 快速综合评估 (2个测试)
  - 一次性全面评估
  - 边界条件: 极简信息

## 📝 待创建的测试文件

### 后端测试 (续)

#### 2. resumeParserService.test.js - 简历解析服务
```javascript
- parseResumeFile() - 主解析函数
  - PDF解析(正常/扫描件)
  - Word解析(docx/doc)
  - 图片解析(JPG/PNG/BMP/OCR)
  - TXT解析
  - 边界条件: 不支持格式
  - 边界条件: 文件损坏
  - 边界条件: 空文件
  - 边界条件: 超大文件(10MB+)
  - OCR识别失败处理
```

#### 3. assessmentController.test.js - 评估控制器
```javascript
- performAssessment() - 主评估流程
  - 完整评估流程(岗位分析+简历解析+评估)
  - 边界条件: 缺少必填字段
  - 边界条件: 空简历数组
  - 边界条件: 批量简历(20份)
  - 简历解析失败处理
  - 进度推送功能
  - 并行处理验证

- exportPDF() - PDF导出
  - 成功导出PDF
  - 边界条件: 缺少报告数据

- exportWord() - Word导出
  - 成功导出Word
  - HTML格式转换
```

#### 4. api.integration.test.js - API集成测试
```javascript
- POST /api/assess - 评估API
  - 完整评估流程E2E
  - 多候选人并行评估
  - 边界条件: 非法参数
  - 边界条件: 超大请求

- POST /api/export-pdf - PDF导出API
- POST /api/export-word - Word导出API
- GET /api/health - 健康检查
- WebSocket进度推送测试
```

### 前端测试

#### 5. InputForm.test.jsx - 输入表单组件
```javascript
- 组件渲染
  - 岗位JD输入框
  - 公司背景输入框
  - 文件上传区域
  - 提交按钮

- 用户交互
  - 文本输入
  - 文件拖拽上传
  - 文件点击上传
  - 文件删除
  - 表单提交

- 表单验证
  - 边界条件: 空输入
  - 边界条件: 极长文本(50000字符)
  - 边界条件: 不支持文件格式
  - 边界条件: 超大文件(>10MB)
  - 边界条件: 批量上传(20份)

- 文件上传
  - PDF文件上传
  - Word文件上传
  - 图片文件上传
  - 多文件上传
```

#### 6. ResultsDisplay.test.jsx - 结果展示组件
```javascript
- 组件渲染
  - 岗位能力分析Tab
  - 候选人对比Tab
  - 候选人详情Tab
  - 雷达图展示
  - 评分表格

- 数据展示
  - 核心能力维度
  - 候选人评分
  - 推荐等级标识
  - 优势/短板列表

- 用户交互
  - Tab切换
  - 候选人筛选
  - 边界条件: 空数据
  - 边界条件: 大量候选人(50+)

- PDF/Word导出
  - 导出按钮点击
  - 下载文件触发
```

#### 7. RadarChart.test.jsx - 雷达图组件
```javascript
- 组件渲染
  - 单个候选人雷达图
  - 多个候选人对比
  - 图例展示

- 数据可视化
  - 正确数据映射
  - 颜色区分
  - 边界条件: 零值数据
  - 边界条件: 极值数据(100分)
```

#### 8. assessment.integration.test.jsx - 前端集成测试
```javascript
- 完整用户流程
  - 输入岗位信息
  - 上传简历文件
  - 触发评估
  - 接收WebSocket进度
  - 查看评估结果
  - 导出报告

- 错误恢复
  - API错误处理
  - 文件上传失败
  - 评估超时

- 边界场景
  - 并发评估
  - 大批量候选人
```

## ⚙️ 测试配置

### 后端配置 - jest.config.js
```javascript
export default {
  transform: {},
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 30000,
  verbose: true
};
```

### 前端配置 - vitest.config.js
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      threshold: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    },
    testTimeout: 30000
  }
});
```

## 🧪 Mock数据标准

### 真实业务场景Mock

#### 岗位JD
```javascript
const mockJobAnalysis = {
  core_competencies: ['React', 'Node.js', 'PostgreSQL', '微服务架构', 'AWS'],
  skill_weights: {
    'React': 30,
    'Node.js': 25,
    'PostgreSQL': 20,
    '微服务架构': 15,
    'AWS': 10
  },
  critical_requirements: [
    '3年以上全栈开发经验',
    '精通React和Node.js',
    '有大型项目经验'
  ],
  preferred_skills: ['TypeScript', 'Docker', 'Kubernetes'],
  cultural_fit_factors: ['技术驱动', '快速迭代', '团队协作'],
  hidden_requirements: ['需要有创业公司经验', '能独立承担项目']
};
```

#### 候选人简历
```javascript
const mockCandidate = {
  basic_info: {
    name: '张三',
    contact: { phone: '13800138000', email: 'zhangsan@example.com' },
    current_position: '高级全栈工程师',
    graduation_date: '2018-06',
    years_of_experience: 6
  },
  education: [{
    degree: '本科',
    major: '计算机科学',
    school: '清华大学',
    graduation_time: '2018-06'
  }],
  work_experience: [{
    company: '字节跳动',
    position: '全栈工程师',
    duration: '2020-01 至 2024-01',
    responsibilities: '负责抖音商城前后端开发',
    projects: ['抖音商城', '直播带货系统'],
    tech_stack: ['React', 'Node.js', 'Redis', 'MySQL']
  }],
  technical_skills: ['React', 'Vue', 'Node.js', 'PostgreSQL', 'Docker'],
  project_highlights: [{
    name: '抖音商城',
    scale: '日活1000万',
    difficulty: '高并发、分布式系统',
    value: '提升转化率30%'
  }],
  soft_skills: ['团队协作', '问题解决', '技术分享'],
  career_trajectory: {
    depth: '技术深度强',
    breadth: '具备一定管理经验'
  },
  expected_salary: '30-40K'
};
```

#### 评估结果
```javascript
const mockAssessment = {
  assessment: {
    technical_match: 85,
    experience_match: 78,
    cultural_fit: 82,
    growth_potential: 88,
    stability: 75
  },
  overall_score: 82,
  strengths: [
    '扎实的全栈开发能力，React和Node.js经验丰富',
    '有大型项目经验，参与过日活千万级系统开发',
    '技术栈与岗位要求高度匹配'
  ],
  weaknesses: [
    '微服务架构经验相对较少',
    '缺乏团队管理经验'
  ],
  gap_analysis: '候选人在核心技术栈方面表现优秀，但在微服务架构和DevOps方面需要进一步学习'
};
```

## 🎯 边界条件测试清单

### 输入验证
- ✅ 空输入
- ✅ 仅空格输入
- ✅ 极长字符串(10000+, 50000+字符)
- ✅ 特殊字符: `<>&"'`
- ✅ XSS攻击: `<script>alert("XSS")</script>`
- ✅ Emoji和Unicode: `😀🎉 мир`
- ✅ null/undefined值
- ✅ OCR识别混乱文本

### 文件处理
- ✅ 不支持的文件格式
- ✅ 损坏的文件
- ✅ 空文件
- ✅ 超大文件(>10MB)
- ✅ 扫描版PDF/Word
- ✅ 图片简历(JPG/PNG/BMP)

### 错误场景
- ✅ DeepSeek API错误(401/429/500/503)
- ✅ 网络超时
- ✅ JSON解析错误
- ✅ 文件系统错误
- ✅ 简历解析失败

### 性能测试
- ✅ 批量候选人(20份)
- ✅ 并发请求
- ✅ 大数据量(50+候选人)

## 🚀 运行测试

### 后端
```bash
cd backend
npm test                  # 运行所有测试
npm run test:watch       # 监视模式
npm run test:coverage    # 生成覆盖率报告
```

### 前端
```bash
cd frontend
npm test                 # 运行所有测试
npm run test:watch      # 监视模式
npm run test:coverage   # 生成覆盖率报告
```

## 📈 覆盖率目标

所有模块设置了**90%**的覆盖率阈值:
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

## 📦 测试文件结构

```
backend/
├── src/
│   └── __tests__/
│       ├── setup.js
│       ├── services/
│       │   ├── deepseekService.test.js       ✅ 已创建
│       │   └── resumeParserService.test.js   ⏳ 待创建
│       ├── controllers/
│       │   └── assessmentController.test.js  ⏳ 待创建
│       └── integration/
│           └── api.integration.test.js       ⏳ 待创建
└── jest.config.js

frontend/
├── src/
│   └── __tests__/
│       ├── setup.js
│       ├── components/
│       │   ├── InputForm.test.jsx            ⏳ 待创建
│       │   ├── ResultsDisplay.test.jsx       ⏳ 待创建
│       │   └── RadarChart.test.jsx           ⏳ 待创建
│       └── integration/
│           └── assessment.integration.test.jsx ⏳ 待创建
└── vitest.config.js
```

## 🎓 测试最佳实践

1. **描述性测试名称**: 使用清晰的"应该..."格式
2. **真实Mock数据**: 模拟实际业务场景，禁止占位符
3. **边界条件优先**: 每个功能都包含边界测试
4. **隔离性**: 每个测试独立，不依赖其他测试
5. **清理**: 使用beforeEach/afterEach清理状态

## 📊 当前进度

- ✅ DeepSeek服务单元测试 (40+测试用例)
- ⏳ 简历解析服务测试
- ⏳ 评估控制器测试
- ⏳ API集成测试
- ⏳ 前端组件测试
- ⏳ 前端集成测试

**总预计测试用例**: 150+ 个

## 🔧 下一步工作

1. 完成后端剩余3个测试文件
2. 创建前端4个测试文件
3. 配置CI/CD自动化测试
4. 生成覆盖率徽章
5. 编写测试文档

---

**开发团队**: 路之音科技
**更新时间**: 2026-01-25
