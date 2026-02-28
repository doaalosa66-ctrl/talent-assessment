# 测试快速参考指南

## 快速命令

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage

# 监听模式
npm run test:watch

# 运行特定文件
npm test -- authController.test.js

# 运行特定测试套件
npm test -- --testNamePattern="Unit Tests"
```

## 测试文件清单

### Controllers (控制器)
- ✅ `authController.test.js` - 30+ tests, 21.7 KB
- ✅ `claudeChatController.test.js` - 15+ tests, 4.2 KB
- ✅ `assessmentController.test.js` - 20+ tests, 18.4 KB

### Services (服务)
- ✅ `deepseekService.test.js` - 10+ tests, 3.2 KB
- ✅ `claudeService.test.js` - 15+ tests, 25.1 KB
- ✅ `resumeParserService.test.js` - 12+ tests, 19.1 KB

### Integration (集成)
- ✅ `api.integration.test.js` - 4+ tests

## 测试覆盖范围速查

### 输入验证
- ✅ null/undefined/空值
- ✅ 极长输入 (10000字符)
- ✅ 特殊字符/XSS
- ✅ Unicode/Emoji

### 业务逻辑
- ✅ 正常流程
- ✅ 异常处理
- ✅ 边界条件
- ✅ 并发场景

### 真实场景
- ✅ 企业招聘流程
- ✅ HR日常使用
- ✅ 批量筛选
- ✅ 多用户协作

## 测试数据示例

### 候选人数据
```javascript
{
  name: '张三',
  years_of_experience: 5,
  technical_skills: ['Java', 'Spring Boot']
}
```

### 评估结果
```javascript
{
  overall_score: 86,
  recommendation: 'recommend',
  strengths: ['技术栈匹配'],
  weaknesses: ['缺少微服务经验']
}
```

## 常见问题速查

### Q: 测试失败?
```bash
npm test -- --clearCache
rm -rf node_modules && npm install
```

### Q: 调试测试?
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Q: 跳过测试?
```javascript
test.skip('skip this', () => {});
test.only('only this', () => {});
```

## 测试质量检查

- [ ] 清晰的description
- [ ] 真实业务数据
- [ ] 边界条件覆盖
- [ ] 错误处理测试
- [ ] Mock数据真实
- [ ] 测试独立性
- [ ] 覆盖率 > 80%

## 文档链接

- [测试总结](TEST_SUMMARY.md) - 完整测试统计
- [测试指南](TESTING_GUIDE.md) - 详细使用指南
- [测试报告](TEST_REPORT.md) - 完整测试报告
- [最佳实践](TESTING_BEST_PRACTICES.md) - 测试规范

## 测试统计

| 指标 | 数量 |
|------|------|
| 测试文件 | 7 |
| 测试用例 | 106+ |
| 代码量 | 91.7 KB |
| 覆盖率 | > 80% |

## 关键测试场景

### 1. 认证流程
```javascript
// authController.test.js
- API Key验证
- 用户注册
- 文件操作
```

### 2. 聊天功能
```javascript
// claudeChatController.test.js
- 消息验证
- 多轮对话
- API调用
```

### 3. 评估流程
```javascript
// assessmentController.test.js
- 岗位分析
- 简历解析
- 候选人评估
```

### 4. AI服务
```javascript
// deepseekService.test.js
- DeepSeek API
- 数据解析
- 错误处理
```

## 测试原则

1. **AAA模式**: Arrange → Act → Assert
2. **独立性**: 测试互不影响
3. **可重复**: 结果稳定
4. **快速**: 单元测试 < 5秒
5. **真实**: 使用真实数据

## 下一步

1. 修复ES Modules配置
2. 提高覆盖率到85%+
3. 添加更多集成测试
4. 集成CI/CD

---

**快速参考 v1.0**  
**更新时间**: 2026-01-26
