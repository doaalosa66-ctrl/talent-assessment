# 测试指南

## 快速开始

### 安装依赖
```bash
npm install
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式运行测试
npm run test:watch
```

## 测试文件结构

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── controllers/
│   │   │   ├── authController.test.js          (21.7 KB, 30+ tests)
│   │   │   ├── claudeChatController.test.js    (4.2 KB, 15+ tests)
│   │   │   └── assessmentController.test.js    (18.4 KB, 20+ tests)
│   │   ├── services/
│   │   │   ├── deepseekService.test.js         (3.2 KB, 10+ tests)
│   │   │   ├── claudeService.test.js           (25.1 KB, 15+ tests)
│   │   │   └── resumeParserService.test.js     (19.1 KB, 12+ tests)
│   │   └── integration/
│   │       └── api.integration.test.js         (新增, 4+ tests)
│   └── ...
├── TEST_SUMMARY.md                              (测试总结文档)
├── TESTING_BEST_PRACTICES.md                    (最佳实践指南)
└── package.json
```

## 测试覆盖范围

### 1. 控制器测试 (Controllers)

#### authController.test.js
- 输入验证 (6个测试)
- API Key验证 (5个测试)
- API Key掩码处理 (3个测试)
- 用户名处理 (6个测试)
- 文件系统操作 (6个测试)
- 边界条件 (5个测试)
- 并发和性能 (2个测试)
- 错误恢复 (2个测试)
- 集成测试 (2个测试)

#### claudeChatController.test.js
- 输入验证 (5个测试)
- API Key处理 (3个测试)
- Claude服务调用 (3个测试)
- 边界条件 (4个测试)
- 集成测试 (3个测试)

#### assessmentController.test.js
- 输入验证 (5个测试)
- 岗位分析 (1个测试)
- 简历解析 (3个测试)
- 边界条件 (3个测试)
- 错误处理 (2个测试)
- 集成测试 (2个测试)
- PDF导出 (3个测试)

### 2. 服务测试 (Services)

#### deepseekService.test.js
- callDeepSeek (3个测试)
- analyzeJobDescription (2个测试)
- parseResume (1个测试)
- 边界条件 (2个测试)

#### claudeService.test.js
- validateApiKey (3个测试)
- sendChat (3个测试)
- 错误处理 (多个测试)

#### resumeParserService.test.js
- PDF解析 (3个测试)
- Word解析 (2个测试)
- 图片解析 (1个测试)
- 文本解析 (1个测试)

### 3. 集成测试 (Integration)

#### api.integration.test.js
- 完整评估流程
- Claude聊天集成
- 批量简历处理
- 错误恢复和弹性

## 运行特定测试

```bash
# 运行特定文件的测试
npm test -- authController.test.js

# 运行特定测试套件
npm test -- --testNamePattern="Unit Tests"

# 运行特定测试用例
npm test -- --testNamePattern="should return 400"

# 运行控制器测试
npm test -- controllers/

# 运行服务测试
npm test -- services/
```

## 查看测试覆盖率

```bash
# 生成覆盖率报告
npm run test:coverage

# 覆盖率报告位置
# - 终端输出: 实时显示
# - HTML报告: coverage/lcov-report/index.html
```

## 测试数据示例

所有测试使用真实业务数据，严禁占位符。

### 真实的候选人数据
```javascript
{
  basic_info: {
    name: '张三',
    contact: { phone: '13800138000', email: 'zhangsan@example.com' },
    current_position: '高级Java工程师',
    years_of_experience: 6
  },
  technical_skills: ['Java', 'Spring Boot', 'MySQL', 'Redis']
}
```

### 真实的评估结果
```javascript
{
  overall_score: 86,
  recommendation: 'recommend',
  strengths: ['技术栈完全匹配', '经验丰富'],
  weaknesses: ['缺少微服务架构经验']
}
```

## 常见问题

### Q1: 测试运行失败怎么办?
```bash
# 清除缓存
npm test -- --clearCache

# 重新安装依赖
rm -rf node_modules
npm install
```

### Q2: 如何调试测试?
```bash
# 使用Node调试器
node --inspect-brk node_modules/.bin/jest --runInBand

# 在测试中添加console.log
test('debug test', () => {
  console.log('Debug info:', data);
  expect(data).toBeDefined();
});
```

### Q3: 如何跳过某个测试?
```javascript
// 跳过单个测试
test.skip('this test will be skipped', () => {
  // ...
});

// 只运行某个测试
test.only('only this test will run', () => {
  // ...
});
```

## 测试质量检查清单

- [ ] 所有测试用例都有清晰的description
- [ ] 使用真实业务数据，无占位符
- [ ] 包含边界条件测试
- [ ] 包含错误处理测试
- [ ] Mock数据模拟真实场景
- [ ] 测试独立，互不影响
- [ ] 测试覆盖率 > 80%

## 贡献指南

### 添加新测试
1. 在对应目录创建测试文件
2. 遵循命名规范: `*.test.js`
3. 使用AAA模式编写测试
4. 添加清晰的测试描述
5. 运行测试确保通过

### 测试代码审查
- 检查测试覆盖率
- 验证测试数据真实性
- 确认边界条件覆盖
- 检查错误处理

## 总结

本测试套件提供:
- 106+ 测试用例
- 91.7 KB 测试代码
- 全面的单元测试和集成测试
- 真实业务场景覆盖
- 严格的边界条件测试

遵循TDD最佳实践，为系统稳定性提供保障。
