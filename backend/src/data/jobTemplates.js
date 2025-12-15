/**
 * 常见岗位JD模板库
 */
export const jobTemplates = [
  {
    id: 'fullstack_engineer',
    name: '全栈工程师',
    category: '技术',
    companyBackground: `我们是一家快速成长的互联网公司，致力于为用户提供优质的产品体验。
团队规模：100人，技术团队占比50%
技术栈：React、Vue、Node.js、Python、MySQL、Redis
团队文化：扁平化管理，鼓励创新和技术分享`,
    jobDescription: `职位：全栈工程师

岗位职责：
1. 负责公司核心产品的前后端开发和维护
2. 参与系统架构设计和技术选型
3. 编写高质量、可维护的代码
4. 优化系统性能，提升用户体验
5. 参与代码审查，保证代码质量

任职要求：
1. 本科及以上学历，计算机相关专业
2. 3年以上全栈开发经验
3. 精通JavaScript/TypeScript，熟悉React或Vue框架
4. 熟悉Node.js后端开发，了解Express/Koa框架
5. 熟悉MySQL/MongoDB等数据库
6. 了解Redis、消息队列等中间件
7. 良好的沟通能力和团队协作精神
8. 有大型项目经验者优先`
  },
  {
    id: 'frontend_engineer',
    name: '前端工程师',
    category: '技术',
    companyBackground: `我们是一家专注于企业级SaaS服务的创业公司。
团队规模：50人，前端团队10人
技术栈：React、TypeScript、Ant Design、Webpack
工作方式：敏捷开发，双周迭代`,
    jobDescription: `职位：高级前端工程师

岗位职责：
1. 负责企业级Web应用的前端开发
2. 与设计师、产品经理紧密合作，实现产品需求
3. 优化前端性能，提升用户体验
4. 参与前端架构设计和技术选型
5. 指导初级工程师，进行代码审查

任职要求：
1. 本科及以上学历，3年以上前端开发经验
2. 精通HTML5、CSS3、JavaScript/TypeScript
3. 熟练使用React/Vue等主流前端框架
4. 熟悉Webpack、Vite等构建工具
5. 了解前端性能优化和工程化实践
6. 有组件库开发经验者优先
7. 有大型B端项目经验者优先`
  },
  {
    id: 'backend_engineer',
    name: '后端工程师',
    category: '技术',
    companyBackground: `我们是一家金融科技公司，为金融机构提供技术解决方案。
团队规模：200人，后端团队40人
技术栈：Java、Spring Boot、MySQL、Redis、Kafka
业务特点：高并发、高可用、强一致性要求`,
    jobDescription: `职位：高级后端工程师(Java)

岗位职责：
1. 负责核心业务系统的后端开发和优化
2. 参与系统架构设计，保证系统高可用和高性能
3. 进行数据库设计和优化
4. 解决生产环境的技术问题
5. 参与技术方案评审和代码审查

任职要求：
1. 本科及以上学历，5年以上Java后端开发经验
2. 精通Java，深入理解JVM原理
3. 熟练使用Spring Boot、MyBatis等框架
4. 精通MySQL，了解索引优化、SQL调优
5. 熟悉Redis、Kafka等中间件
6. 了解分布式系统设计，有高并发系统经验
7. 有金融行业经验者优先`
  },
  {
    id: 'product_manager',
    name: '产品经理',
    category: '产品',
    companyBackground: `我们是一家教育科技公司，专注于K12在线教育。
团队规模：80人，产品团队15人
用户规模：日活50万+
业务模式：B2C，订阅制`,
    jobDescription: `职位：产品经理

岗位职责：
1. 负责教育产品的规划和设计
2. 深入了解用户需求，制定产品方案
3. 撰写PRD文档，与设计、开发团队协作推进产品落地
4. 跟踪产品数据，持续优化产品体验
5. 研究竞品，把握行业趋势

任职要求：
1. 本科及以上学历，3年以上产品经理经验
2. 有教育行业或内容产品经验者优先
3. 具备良好的用户思维和数据分析能力
4. 熟练使用Axure、Figma等原型工具
5. 优秀的沟通协调能力和项目推动能力
6. 对教育行业有热情，关注用户体验`
  },
  {
    id: 'ai_engineer',
    name: 'AI算法工程师',
    category: '技术',
    companyBackground: `我们是一家人工智能创业公司，专注于计算机视觉和NLP技术。
团队规模：60人，算法团队20人
技术栈：Python、PyTorch、TensorFlow、CUDA
研究方向：大模型应用、AIGC、多模态`,
    jobDescription: `职位：AI算法工程师(NLP方向)

岗位职责：
1. 负责自然语言处理相关算法的研发和优化
2. 参与大模型的训练、微调和部署
3. 探索前沿技术，解决业务中的NLP问题
4. 撰写技术文档，分享研究成果

任职要求：
1. 硕士及以上学历，计算机或相关专业
2. 2年以上NLP算法研发经验
3. 精通Python，熟练使用PyTorch/TensorFlow
4. 熟悉Transformer、BERT、GPT等模型
5. 有大模型微调、Prompt Engineering经验者优先
6. 有RAG、Agent等应用开发经验者优先
7. 在顶会(ACL/EMNLP/NeurIPS等)发表论文者优先`
  },
  {
    id: 'data_analyst',
    name: '数据分析师',
    category: '数据',
    companyBackground: `我们是一家电商平台，日订单量10万+。
团队规模：150人，数据团队25人
数据基础设施：Hadoop、Spark、Hive、ClickHouse
业务特点：用户行为分析、推荐系统、AB测试`,
    jobDescription: `职位：高级数据分析师

岗位职责：
1. 负责核心业务的数据分析和洞察挖掘
2. 建立数据指标体系，监控业务健康度
3. 设计和分析AB测试，支持产品决策
4. 搭建数据看板，实现数据可视化
5. 与产品、运营团队协作，提供数据支持

任职要求：
1. 本科及以上学历，统计学/数学/计算机相关专业
2. 3年以上数据分析经验，有电商行业经验优先
3. 精通SQL，熟练使用Python进行数据分析
4. 熟悉pandas、numpy等数据分析库
5. 掌握统计学知识，了解AB测试原理
6. 熟练使用Tableau/PowerBI等可视化工具
7. 良好的业务理解能力和沟通能力`
  },
  {
    id: 'ui_designer',
    name: 'UI设计师',
    category: '设计',
    companyBackground: `我们是一家专注于品质的互联网公司，追求极致的设计体验。
团队规模：70人，设计团队12人
设计理念：简约、优雅、以用户为中心
工具：Figma、Sketch、Adobe全家桶`,
    jobDescription: `职位：资深UI设计师

岗位职责：
1. 负责公司产品的UI视觉设计
2. 与UX设计师协作，将交互方案转化为视觉设计
3. 制定和维护设计规范，保证设计一致性
4. 与开发团队紧密合作，确保设计落地质量
5. 关注设计趋势，持续提升设计水平

任职要求：
1. 本科及以上学历，设计相关专业
2. 3年以上UI设计经验，有完整项目经验
3. 精通Figma/Sketch，熟悉设计规范制定
4. 具备优秀的视觉表现力和审美能力
5. 了解前端开发基础知识，能与工程师有效沟通
6. 有B端产品设计经验者优先
7. 有作品集展示`
  }
];

/**
 * 根据关键词搜索匹配的模板
 */
export function searchTemplates(keyword) {
  if (!keyword) return jobTemplates;

  const lowerKeyword = keyword.toLowerCase();
  return jobTemplates.filter(template =>
    template.name.toLowerCase().includes(lowerKeyword) ||
    template.category.toLowerCase().includes(lowerKeyword) ||
    template.jobDescription.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * 获取所有分类
 */
export function getCategories() {
  const categories = new Set(jobTemplates.map(t => t.category));
  return Array.from(categories);
}

export default {
  jobTemplates,
  searchTemplates,
  getCategories
};
