import React, { useState } from 'react';
import { Tabs, Button, Descriptions, Card, Table, Tag, Typography, Progress, Space, Collapse } from 'antd';
import { ReloadOutlined, TrophyOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import RadarChart from './RadarChart';

const { Title, Paragraph, Text } = Typography;

function ResultsDisplay({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('1');

  // 推荐等级映射
  const recommendationMap = {
    strong_recommend: { text: '强烈推荐', color: 'success', icon: <TrophyOutlined /> },
    recommend: { text: '推荐', color: 'processing', icon: <CheckCircleOutlined /> },
    consider: { text: '待定', color: 'warning', icon: <WarningOutlined /> },
    not_recommend: { text: '不推荐', color: 'error', icon: <WarningOutlined /> },
    parse_failed: { text: '未解析', color: 'default', icon: <WarningOutlined /> }
  };

  // 安全地转换为字符串
  const safeString = (value, defaultValue = '未知') => {
    if (!value) return defaultValue;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // 格式化联系方式
  const formatContact = (contact) => {
    if (!contact) return '未提供';
    if (typeof contact === 'string') return contact;
    if (typeof contact === 'object') {
      const parts = [];
      if (contact.phone) parts.push(`电话: ${contact.phone}`);
      if (contact.email) parts.push(`邮箱: ${contact.email}`);
      if (contact.wechat) parts.push(`微信: ${contact.wechat}`);
      return parts.length > 0 ? parts.join(' | ') : '未提供';
    }
    return '未提供';
  };

  // 1. 岗位能力分析报告
  const renderJobAnalysis = () => {
    // 处理核心能力维度与权重的映射关系
    const competenciesWithWeights = [];

    // 获取权重数据
    const skillWeights = data.job_analysis.skill_weights || {};

    // 如果skill_weights是数组格式
    if (Array.isArray(skillWeights)) {
      skillWeights.forEach(item => {
        competenciesWithWeights.push({
          name: item.dimension || item.name,
          weight: item.weight,
          description: item.description || '该能力维度为岗位核心要求'
        });
      });
    }
    // 如果skill_weights是对象格式
    else if (typeof skillWeights === 'object' && Object.keys(skillWeights).length > 0) {
      Object.entries(skillWeights).forEach(([name, weight]) => {
        // 从core_competencies中查找对应的描述
        const comp = data.job_analysis.core_competencies?.find(c => {
          const compName = typeof c === 'string' ? c : (c.dimension || c.name);
          return compName === name;
        });

        competenciesWithWeights.push({
          name,
          weight,
          description: typeof comp === 'object' ? (comp.description || '该能力维度为岗位核心要求') : '该能力维度为岗位核心要求'
        });
      });
    }

    // 按权重倒序排列
    competenciesWithWeights.sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return (
      <Card title="📊 岗位能力分析报告">
        <Title level={4}>核心能力维度与权重分配</Title>
        {competenciesWithWeights.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {competenciesWithWeights.map((comp, index) => (
              <div key={comp.name} style={{
                padding: '12px 16px',
                background: '#f8f9fa',
                borderRadius: 8,
                borderLeft: '3px solid #1677ff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text strong>{comp.name}</Text>
                  <Tag color="blue">{comp.weight}%</Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>{comp.description}</Text>
              </div>
            ))}
          </Space>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#999' }}>
            暂无能力维度数据
          </div>
        )}

        <Title level={4} style={{ marginTop: 24 }}>关键硬性要求（一票否决项）</Title>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
        {data.job_analysis.critical_requirements?.map((req, index) => (
          <Tag color="red" key={index} style={{ padding: '6px 10px', fontSize: 13 }}>
            {typeof req === 'string' ? req : (req.requirement || req.description || '硬性要求')}
          </Tag>
        ))}
      </Space>

      {data.job_analysis.preferred_skills && (
        <>
          <Title level={4} style={{ marginTop: 16 }}>加分项技能</Title>
          <Space wrap>
            {data.job_analysis.preferred_skills.map((skill, index) => (
              <Tag color="blue" key={index}>
                {typeof skill === 'string' ? skill : (skill.skill || skill.name || '加分技能')}
              </Tag>
            ))}
          </Space>
        </>
      )}
    </Card>
    );
  };

  // 2. 候选人综合评估看板
  const renderOverview = () => {
    const columns = [
      {
        title: '候选人',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        fixed: 'left',
        render: (text) => <Text strong>{safeString(text)}</Text>
      },
      {
        title: '技术匹配度',
        dataIndex: 'technical_match',
        key: 'technical_match',
        width: 90,
        render: (score) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Progress
              type="circle"
              percent={score}
              width={40}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        )
      },
      {
        title: '经验匹配度',
        dataIndex: 'experience_match',
        key: 'experience_match',
        width: 90,
        render: (score) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Progress
              type="circle"
              percent={score}
              width={40}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        )
      },
      {
        title: '文化契合度',
        dataIndex: 'cultural_fit',
        key: 'cultural_fit',
        width: 90,
        render: (score) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Progress
              type="circle"
              percent={score}
              width={40}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        )
      },
      {
        title: '综合评分',
        dataIndex: 'overall_score',
        key: 'overall_score',
        width: 100,
        sorter: (a, b) => a.overall_score - b.overall_score,
        render: (score) => (
          <Title level={3} style={{ margin: 0, color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f' }}>
            {score}
          </Title>
        )
      },
      {
        title: '推荐等级',
        dataIndex: 'recommendation',
        key: 'recommendation',
        width: 110,
        render: (rec) => {
          const config = recommendationMap[rec] || recommendationMap.not_recommend;
          return (
            <Tag color={config.color} icon={config.icon} style={{ fontSize: 13, padding: '4px 10px' }}>
              {config.text}
            </Tag>
          );
        }
      }
    ];

    return (
      <Card title="📈 候选人综合评估看板">
        <Table
          columns={columns}
          dataSource={data.candidates_overview?.map((item, index) => ({ ...item, key: index }))}
          pagination={false}
        />
      </Card>
    );
  };

  // 3-5. 候选人详细分析
  const renderCandidateDetails = () => {
    // 先对候选人按综合评分排序（从高到低）
    const sortedCandidates = [...(data.candidates_detail || [])].sort((a, b) => {
      const scoreA = data.candidates_overview?.find(item => item.name === a.candidate_info.name)?.overall_score || 0;
      const scoreB = data.candidates_overview?.find(item => item.name === b.candidate_info.name)?.overall_score || 0;
      return scoreB - scoreA; // 降序排序
    });

    return sortedCandidates.map((candidate, index) => {
      const recConfig = recommendationMap[candidate.decision.recommendation] || recommendationMap.not_recommend;

      // 从candidates_overview中获取综合评分
      const overviewData = data.candidates_overview?.find(item => item.name === candidate.candidate_info.name);
      const overallScore = overviewData?.overall_score || 0;

      // 确定评分颜色
      const scoreColor = overallScore >= 80 ? '#52c41a' : overallScore >= 60 ? '#faad14' : '#ff4d4f';

      return (
        <Card
          key={index}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{`候选人 ${index + 1}: ${safeString(candidate.candidate_info.name)}`}</span>
              <Tag color={scoreColor} style={{ fontSize: 14, padding: '4px 10px', minWidth: '60px', textAlign: 'center' }}>
                综合评分: {overallScore}
              </Tag>
            </div>
          }
          style={{ marginBottom: 16 }}
          extra={
            <Tag color={recConfig.color} icon={recConfig.icon} style={{ fontSize: 14, padding: '6px 12px' }}>
              {recConfig.text}
            </Tag>
          }
        >
          {/* 解析状态 - 如果解析失败，显示错误信息 */}
          {candidate.parse_status && !candidate.parse_status.success && (
            <Card
              title="❌ 简历解析失败"
              size="small"
              style={{
                marginBottom: 12,
                background: '#fff1f0',
                borderColor: '#ffa39e'
              }}
            >
              <Paragraph style={{ marginBottom: 8, fontSize: 13 }}>
                <Text strong type="danger">失败原因：</Text>
                <Text type="danger">{candidate.parse_status.error}</Text>
              </Paragraph>
              <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
                <Text type="secondary">
                  由于简历解析失败，系统无法提取候选人信息，因此无法进行评估。请检查简历文件格式是否正确，或尝试重新上传。
                </Text>
              </Paragraph>
            </Card>
          )}

          {/* 基本信息 */}
          <Descriptions title="基本信息" bordered column={2} size="small">
            <Descriptions.Item label="姓名">{safeString(candidate.candidate_info.name)}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{formatContact(candidate.candidate_info.contact)}</Descriptions.Item>
            <Descriptions.Item label="工作年限">{safeString(candidate.candidate_info.years_of_experience)}</Descriptions.Item>
            <Descriptions.Item label="当前职位">{safeString(candidate.candidate_info.current_position)}</Descriptions.Item>
          </Descriptions>

          {/* 只有解析成功才显示评估内容 */}
          {(!candidate.parse_status || candidate.parse_status.success) && (
            <>
              {/* 能力雷达图 */}
              <Card title="能力雷达图" size="small" style={{ marginTop: 8 }}>
                <RadarChart data={candidate.assessment.assessment} />
              </Card>

              {/* 文化契合度子指标 */}
              {candidate.assessment.assessment?.cultural_fit_detail && (
                <Card title="🤝 文化契合度详情" size="small" style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      文化契合度由3个有简历证据支撑的子指标合成，避免主观猜测
                    </Text>
                  </div>
                  {[
                    {
                      key: 'collaboration_score',
                      label: '协作信号',
                      desc: '跨团队协作、带人、mentor经历',
                      evidenceKey: 'collaboration_evidence',
                      weight: '40%',
                      color: '#1677ff'
                    },
                    {
                      key: 'ownership_score',
                      label: '主人翁信号',
                      desc: '主动推动改进、从0到1主导、提出方案',
                      evidenceKey: 'ownership_evidence',
                      weight: '40%',
                      color: '#52c41a'
                    },
                    {
                      key: 'communication_score',
                      label: '沟通信号',
                      desc: '对外汇报、客户沟通、技术分享',
                      evidenceKey: 'communication_evidence',
                      weight: '20%',
                      color: '#fa8c16'
                    }
                  ].map(item => {
                    const detail = candidate.assessment.assessment.cultural_fit_detail;
                    const score = detail[item.key] ?? 50;
                    const evidence = detail[item.evidenceKey] || [];
                    return (
                      <div key={item.key} style={{
                        padding: '10px 14px',
                        marginBottom: 8,
                        background: '#fafafa',
                        borderRadius: 6,
                        borderLeft: `3px solid ${item.color}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Space size={6}>
                            <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                            <Tag color="default" style={{ fontSize: 11 }}>权重 {item.weight}</Tag>
                          </Space>
                          <Text strong style={{
                            fontSize: 16,
                            color: score >= 75 ? '#52c41a' : score >= 55 ? '#faad14' : '#ff4d4f'
                          }}>{score}</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{item.desc}</Text>
                        {evidence.length > 0 ? (
                          <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            {evidence.map((e, i) => (
                              <Text key={i} style={{ fontSize: 12 }}>
                                <CheckCircleOutlined style={{ color: item.color, marginRight: 4 }} />
                                {safeString(e)}
                              </Text>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <WarningOutlined style={{ marginRight: 4 }} />
                            简历中未找到明确证据，给予中间分 50
                          </Text>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      合成分 = 协作×40% + 主人翁×40% + 沟通×20% = <Text strong>{candidate.assessment.assessment.cultural_fit}</Text>
                    </Text>
                  </div>
                </Card>
              )}

              {/* 核心优势 */}
              <Card title="✅ 核心优势分析" size="small" style={{ marginTop: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {candidate.assessment.strengths?.map((strength, idx) => (
                    <Card key={idx} size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginBottom: 4 }}>
                      <Paragraph style={{ margin: 0, fontSize: 13 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {safeString(strength, '')}
                      </Paragraph>
                    </Card>
                  ))}
                </Space>
              </Card>

              {/* 潜在风险与短板 */}
              <Card title="⚠️ 潜在风险与短板" size="small" style={{ marginTop: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {candidate.assessment.weaknesses?.map((weakness, idx) => (
                    <Card key={idx} size="small" style={{ background: '#fff2e8', borderColor: '#ffbb96', marginBottom: 4 }}>
                      <Paragraph style={{ margin: 0, fontSize: 13 }}>
                        <WarningOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                        {safeString(weakness, '')}
                      </Paragraph>
                    </Card>
                  ))}
                </Space>
              </Card>

              {/* Gap分析 */}
              <Card title="📉 与岗位要求的差距分析" size="small" style={{ marginTop: 8 }}>
                <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>{safeString(candidate.assessment.gap_analysis, '暂无分析')}</Paragraph>
              </Card>

              {/* 邀约决策报告 */}
              <Card title="🎯 智能邀约决策" size="small" style={{ marginTop: 8 }}>
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="邀约建议">
                    <Tag color={recConfig.color} icon={recConfig.icon} style={{ fontSize: 13 }}>
                      {recConfig.text}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="决策置信度">
                    <Progress percent={Math.round(candidate.decision.confidence_score * 100)} size="small" />
                  </Descriptions.Item>
                  <Descriptions.Item label="预期面试通过率">
                    <Progress percent={Math.round(candidate.decision.expected_success_rate * 100)} strokeColor="#52c41a" size="small" />
                  </Descriptions.Item>
                  <Descriptions.Item label="薪资匹配度分析">
                    {safeString(candidate.decision.salary_match, '待评估')}
                  </Descriptions.Item>
                </Descriptions>

                <Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>决策理由</Title>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {candidate.decision.rationale?.map((reason, idx) => (
                    <Text key={idx} style={{ fontSize: 13 }}>• {safeString(reason, '')}</Text>
                  ))}
                </Space>

                {candidate.decision.risk_factors && candidate.decision.risk_factors.length > 0 && (
                  <>
                    <Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>风险因素</Title>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {candidate.decision.risk_factors.map((risk, idx) => (
                        <Text key={idx} type="warning" style={{ fontSize: 13 }}>⚠️ {safeString(risk, '')}</Text>
                      ))}
                    </Space>
                  </>
                )}
              </Card>

              {/* 个性化测评方案（仅推荐候选人） */}
              {candidate.custom_assessment && (
                <Card title="📝 深度测评与面试方案" size="small" style={{ marginTop: 8 }}>
                  <Collapse
                    defaultActiveKey={['1']}
                    items={[
                      {
                        key: '1',
                        label: '技术深度测评题（3-5道）',
                        children: candidate.custom_assessment.technical_questions?.map((q, idx) => (
                          <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                            <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{safeString(q.question, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>参考答案：</Text>{safeString(q.reference_answer, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{safeString(q.scoring_criteria, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{safeString(q.competency_assessed, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 0 }}>
                              <Text strong type="danger">红牌警告：</Text>
                              <Text type="danger" style={{ fontSize: 13 }}>{safeString(q.red_flags, '')}</Text>
                            </Paragraph>
                          </Card>
                        ))
                      },
                      {
                        key: '2',
                        label: '行为面试题（2-3道）',
                        children: candidate.custom_assessment.behavioral_questions?.map((q, idx) => (
                          <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                            <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{safeString(q.question, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>预期要点：</Text>{safeString(q.expected_points, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{safeString(q.scoring_criteria, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{safeString(q.competency_assessed, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 0 }}>
                              <Text strong type="danger">红牌警告：</Text>
                              <Text type="danger" style={{ fontSize: 13 }}>{safeString(q.red_flags, '')}</Text>
                            </Paragraph>
                          </Card>
                        ))
                      },
                      {
                        key: '3',
                        label: '情景模拟题（1-2道）',
                        children: candidate.custom_assessment.situational_questions?.map((q, idx) => (
                          <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                            <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>场景：</Text>{safeString(q.scenario, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{safeString(q.question, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>参考答案：</Text>{safeString(q.reference_answer, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{safeString(q.scoring_criteria, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{safeString(q.competency_assessed, '')}</Paragraph>
                            <Paragraph style={{ marginBottom: 0 }}>
                              <Text strong type="danger">红牌警告：</Text>
                              <Text type="danger" style={{ fontSize: 13 }}>{safeString(q.red_flags, '')}</Text>
                            </Paragraph>
                          </Card>
                        ))
                      }
                    ]}
                  />
                </Card>
              )}
            </>
          )}
        </Card>
      );
    });
  };

  const tabItems = [
    {
      key: '1',
      label: '📊 岗位能力分析',
      children: renderJobAnalysis()
    },
    {
      key: '2',
      label: '📈 候选人对比看板',
      children: renderOverview()
    },
    {
      key: '3',
      label: '👤 候选人详细分析',
      children: <div>{renderCandidateDetails()}</div>
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>评估报告</Title>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}

export default ResultsDisplay;
