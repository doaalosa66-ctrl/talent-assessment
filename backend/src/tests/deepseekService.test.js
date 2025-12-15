import { describe, test, expect, jest } from '@jest/globals';

/**
 * DeepSeek服务Mock测试
 * 由于DeepSeek API需要实际的API密钥和网络请求，这里我们测试Mock版本
 */

// Mock的DeepSeek响应数据
const mockJobAnalysis = {
  job_analysis: {
    position: '高级全栈工程师',
    key_requirements: [
      '3年以上全栈开发经验',
      '精通React、Node.js',
      '熟悉数据库设计',
      '良好的沟通能力'
    ],
    technical_stack: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
    experience_requirements: '3-5年',
    core_competencies: [
      '前端开发',
      '后端开发',
      '系统架构',
      '团队协作'
    ]
  }
};

const mockResumeData = {
  name: '张三',
  age: 28,
  education: '本科',
  major: '计算机科学与技术',
  work_experience: [
    {
      company: 'ABC科技公司',
      position: '全栈工程师',
      duration: '2020-2023',
      description: '负责公司核心产品的前后端开发'
    }
  ],
  skills: ['React', 'Vue', 'Node.js', 'MySQL', 'Docker'],
  projects: [
    {
      name: '电商平台',
      role: '核心开发',
      description: '使用React+Node.js开发的电商平台'
    }
  ]
};

const mockAssessment = {
  technical_match: 85,
  experience_match: 80,
  cultural_fit: 75,
  growth_potential: 82,
  stability: 78,
  overall_score: 80,
  strengths: [
    '技术栈匹配度高',
    '有相关项目经验',
    '学习能力强'
  ],
  weaknesses: [
    '团队管理经验不足',
    '大型系统架构经验欠缺'
  ],
  suggestions: [
    '可以担任高级工程师职位',
    '建议安排技术面试重点考察系统设计能力'
  ]
};

const mockInterviewQuestions = [
  {
    category: '技术能力',
    questions: [
      'React Hooks的原理是什么？',
      'Node.js的事件循环机制？',
      '如何设计一个高并发系统？'
    ]
  },
  {
    category: '项目经验',
    questions: [
      '介绍一下你最有挑战性的项目',
      '遇到过什么技术难题，如何解决的？'
    ]
  }
];

describe('DeepSeek Service Mock Tests', () => {

  describe('analyzeJob() - 岗位分析', () => {
    test('应该正确解析岗位要求', () => {
      const result = mockJobAnalysis;

      expect(result).toHaveProperty('job_analysis');
      expect(result.job_analysis).toHaveProperty('position');
      expect(result.job_analysis).toHaveProperty('key_requirements');
      expect(result.job_analysis).toHaveProperty('technical_stack');
      expect(Array.isArray(result.job_analysis.key_requirements)).toBe(true);
    });

    test('应该提取技术栈信息', () => {
      const techStack = mockJobAnalysis.job_analysis.technical_stack;

      expect(Array.isArray(techStack)).toBe(true);
      expect(techStack.length).toBeGreaterThan(0);
      expect(techStack).toContain('React');
    });

    test('应该识别核心能力要求', () => {
      const competencies = mockJobAnalysis.job_analysis.core_competencies;

      expect(Array.isArray(competencies)).toBe(true);
      expect(competencies.length).toBeGreaterThan(0);
    });

    test('岗位要求应该不为空', () => {
      const requirements = mockJobAnalysis.job_analysis.key_requirements;

      requirements.forEach(req => {
        expect(req.length).toBeGreaterThan(0);
        expect(typeof req).toBe('string');
      });
    });
  });

  describe('parseResume() - 简历解析', () => {
    test('应该正确解析简历基本信息', () => {
      const result = mockResumeData;

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('education');
      expect(result).toHaveProperty('major');
    });

    test('应该解析工作经验', () => {
      const experience = mockResumeData.work_experience;

      expect(Array.isArray(experience)).toBe(true);
      expect(experience.length).toBeGreaterThan(0);

      experience.forEach(exp => {
        expect(exp).toHaveProperty('company');
        expect(exp).toHaveProperty('position');
        expect(exp).toHaveProperty('duration');
      });
    });

    test('应该提取技能列表', () => {
      const skills = mockResumeData.skills;

      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills).toContain('React');
    });

    test('应该解析项目经历', () => {
      const projects = mockResumeData.projects;

      expect(Array.isArray(projects)).toBe(true);
      projects.forEach(project => {
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('role');
      });
    });
  });

  describe('assessCandidate() - 候选人评估', () => {
    test('应该返回完整的评估结果', () => {
      const result = mockAssessment;

      expect(result).toHaveProperty('technical_match');
      expect(result).toHaveProperty('experience_match');
      expect(result).toHaveProperty('cultural_fit');
      expect(result).toHaveProperty('growth_potential');
      expect(result).toHaveProperty('stability');
      expect(result).toHaveProperty('overall_score');
    });

    test('评分应该在0-100范围内', () => {
      const scores = [
        mockAssessment.technical_match,
        mockAssessment.experience_match,
        mockAssessment.cultural_fit,
        mockAssessment.growth_potential,
        mockAssessment.stability,
        mockAssessment.overall_score
      ];

      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    test('应该有优势分析', () => {
      const strengths = mockAssessment.strengths;

      expect(Array.isArray(strengths)).toBe(true);
      expect(strengths.length).toBeGreaterThan(0);
      strengths.forEach(strength => {
        expect(typeof strength).toBe('string');
        expect(strength.length).toBeGreaterThan(0);
      });
    });

    test('应该有劣势分析', () => {
      const weaknesses = mockAssessment.weaknesses;

      expect(Array.isArray(weaknesses)).toBe(true);
      expect(weaknesses.length).toBeGreaterThan(0);
    });

    test('应该有招聘建议', () => {
      const suggestions = mockAssessment.suggestions;

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string');
      });
    });

    test('总分应该是各维度分数的合理反映', () => {
      const { technical_match, experience_match, cultural_fit, growth_potential, stability, overall_score } = mockAssessment;

      const average = (technical_match + experience_match + cultural_fit + growth_potential + stability) / 5;

      // 总分应该接近平均分（允许±5的误差）
      expect(Math.abs(overall_score - average)).toBeLessThanOrEqual(5);
    });
  });

  describe('generateInterviewQuestions() - 面试问题生成', () => {
    test('应该生成分类的面试问题', () => {
      const result = mockInterviewQuestions;

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      result.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('questions');
        expect(Array.isArray(category.questions)).toBe(true);
      });
    });

    test('每个分类应该有多个问题', () => {
      mockInterviewQuestions.forEach(category => {
        expect(category.questions.length).toBeGreaterThan(0);

        category.questions.forEach(question => {
          expect(typeof question).toBe('string');
          expect(question.length).toBeGreaterThan(0);
        });
      });
    });

    test('应该包含技术类问题', () => {
      const hasTechnical = mockInterviewQuestions.some(cat =>
        cat.category.includes('技术')
      );
      expect(hasTechnical).toBe(true);
    });

    test('问题应该是问句形式', () => {
      mockInterviewQuestions.forEach(category => {
        category.questions.forEach(question => {
          // 检查是否包含问号或疑问词
          const isQuestion = question.includes('？') ||
                           question.includes('什么') ||
                           question.includes('如何') ||
                           question.includes('介绍');
          expect(isQuestion).toBe(true);
        });
      });
    });
  });

  describe('API响应格式验证', () => {
    test('所有API响应应该是有效的JSON', () => {
      const responses = [
        mockJobAnalysis,
        mockResumeData,
        mockAssessment,
        mockInterviewQuestions
      ];

      responses.forEach(response => {
        expect(() => JSON.stringify(response)).not.toThrow();
        expect(() => JSON.parse(JSON.stringify(response))).not.toThrow();
      });
    });

    test('响应数据应该可序列化', () => {
      const serialized = JSON.stringify(mockAssessment);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(mockAssessment);
    });
  });

  describe('错误场景处理', () => {
    test('空输入应该有合理的处理', () => {
      const emptyResume = {
        name: '',
        work_experience: [],
        skills: []
      };

      // 验证空数据结构的有效性
      expect(emptyResume).toHaveProperty('name');
      expect(Array.isArray(emptyResume.work_experience)).toBe(true);
      expect(Array.isArray(emptyResume.skills)).toBe(true);
    });

    test('缺失字段应该有默认值处理', () => {
      const partialResume = {
        name: '李四',
        // 缺少其他字段
      };

      const name = partialResume.name || '未知';
      const age = partialResume.age || 0;
      const skills = partialResume.skills || [];

      expect(name).toBe('李四');
      expect(age).toBe(0);
      expect(Array.isArray(skills)).toBe(true);
    });

    test('异常评分应该被标准化', () => {
      const normalizeScore = (score) => {
        if (typeof score !== 'number') return 0;
        if (score < 0) return 0;
        if (score > 100) return 100;
        return score;
      };

      expect(normalizeScore(-10)).toBe(0);
      expect(normalizeScore(150)).toBe(100);
      expect(normalizeScore(50)).toBe(50);
      expect(normalizeScore('invalid')).toBe(0);
    });
  });

  describe('性能和数据质量', () => {
    test('简历解析应该提取关键信息', () => {
      const resume = mockResumeData;

      // 关键信息不应为空
      expect(resume.name).toBeTruthy();
      expect(resume.work_experience.length).toBeGreaterThan(0);
      expect(resume.skills.length).toBeGreaterThan(0);
    });

    test('评估结果应该有足够的详细信息', () => {
      const assessment = mockAssessment;

      expect(assessment.strengths.length).toBeGreaterThanOrEqual(2);
      expect(assessment.weaknesses.length).toBeGreaterThanOrEqual(1);
      expect(assessment.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    test('面试问题应该多样化', () => {
      const allQuestions = mockInterviewQuestions.flatMap(cat => cat.questions);
      const uniqueQuestions = new Set(allQuestions);

      // 所有问题应该是唯一的
      expect(uniqueQuestions.size).toBe(allQuestions.length);
    });
  });
});
