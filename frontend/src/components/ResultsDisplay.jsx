import React, { useState } from 'react';
import { Tabs, Button, Descriptions, Card, Table, Tag, Typography, Progress, Space, Collapse } from 'antd';
import { ReloadOutlined, TrophyOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import RadarChart from './RadarChart';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

function ResultsDisplay({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('1');

  // 推荐等级映射
  const recommendationMap = {
    strong_recommend: { text: '强烈推荐', color: 'success', icon: <TrophyOutlined /> },
    recommend: { text: '推荐', color: 'processing', icon: <CheckCircleOutlined /> },
    consider: { text: '待定', color: 'warning', icon: <WarningOutlined /> },
    not_recommend: { text: '不推荐', color: 'error', icon: <WarningOutlined /> }
  };

  // 1. 岗位能力分析报告
  const renderJobAnalysis = () => (
    <Card title="📊 岗位能力分析报告">
      <Title level={4}>核心能力维度</Title>
      <Collapse defaultActiveKey={['1']}>
        {data.job_analysis.core_competencies?.map((comp, index) => (
          <Panel
            header={typeof comp === 'string' ? comp : (comp.dimension || comp.name || `能力${index + 1}`)}
            key={index}
          >
            <Text>{typeof comp === 'string' ? '该能力维度为岗位核心要求' : (comp.description || '该能力维度为岗位核心要求')}</Text>
          </Panel>
        ))}
      </Collapse>

      <Title level={4}>能力权重分配</Title>
      <div style={{ marginBottom: 12 }}>
        {Object.entries(data.job_analysis.skill_weights || {}).map(([skill, weight]) => (
          <div key={skill} style={{ marginBottom: 8 }}>
            <Text strong>{skill}</Text>
            <Progress percent={weight} status="active" />
          </div>
        ))}
      </div>

      <Title level={4}>关键硬性要求（一票否决项）</Title>
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

  // 2. 候选人综合评估看板
  const renderOverview = () => {
    const columns = [
      {
        title: '候选人',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        fixed: 'left',
        render: (text) => <Text strong>{text}</Text>
      },
      {
        title: '技术匹配度',
        dataIndex: 'technical_match',
        key: 'technical_match',
        render: (score) => (
          <div>
            <Progress
              type="circle"
              percent={score}
              width={50}
              strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
            />
          </div>
        )
      },
      {
        title: '经验匹配度',
        dataIndex: 'experience_match',
        key: 'experience_match',
        render: (score) => (
          <Progress
            type="circle"
            percent={score}
            width={50}
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
          />
        )
      },
      {
        title: '文化契合度',
        dataIndex: 'cultural_fit',
        key: 'cultural_fit',
        render: (score) => (
          <Progress
            type="circle"
            percent={score}
            width={50}
            strokeColor={score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'}
          />
        )
      },
      {
        title: '综合评分',
        dataIndex: 'overall_score',
        key: 'overall_score',
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
        render: (rec) => {
          const config = recommendationMap[rec] || recommendationMap.not_recommend;
          return (
            <Tag color={config.color} icon={config.icon} style={{ fontSize: 14, padding: '6px 12px' }}>
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
          scroll={{ x: 800 }}
        />
      </Card>
    );
  };

  // 3-5. 候选人详细分析
  const renderCandidateDetails = () => {
    return data.candidates_detail?.map((candidate, index) => {
      const recConfig = recommendationMap[candidate.decision.recommendation] || recommendationMap.not_recommend;

      return (
        <Card
          key={index}
          title={`候选人 ${index + 1}: ${candidate.candidate_info.name}`}
          style={{ marginBottom: 16 }}
          extra={
            <Tag color={recConfig.color} icon={recConfig.icon} style={{ fontSize: 14, padding: '6px 12px' }}>
              {recConfig.text}
            </Tag>
          }
        >
          {/* 基本信息 */}
          <Descriptions title="基本信息" bordered column={2} size="small">
            <Descriptions.Item label="姓名">{candidate.candidate_info.name}</Descriptions.Item>
            <Descriptions.Item label="联系方式">{candidate.candidate_info.contact || '未提供'}</Descriptions.Item>
            <Descriptions.Item label="工作年限">{candidate.candidate_info.years_of_experience || '未知'}</Descriptions.Item>
            <Descriptions.Item label="当前职位">{candidate.candidate_info.current_position || '未知'}</Descriptions.Item>
          </Descriptions>

          {/* 能力雷达图 */}
          <Card title="能力雷达图" size="small" style={{ marginTop: 12 }}>
            <RadarChart data={candidate.assessment.assessment} />
          </Card>

          {/* 核心优势 */}
          <Card title="✅ 核心优势分析" size="small" style={{ marginTop: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {candidate.assessment.strengths?.map((strength, idx) => (
                <Card key={idx} size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f', marginBottom: 4 }}>
                  <Paragraph style={{ margin: 0, fontSize: 13 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    {strength}
                  </Paragraph>
                </Card>
              ))}
            </Space>
          </Card>

          {/* 潜在风险与短板 */}
          <Card title="⚠️ 潜在风险与短板" size="small" style={{ marginTop: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {candidate.assessment.weaknesses?.map((weakness, idx) => (
                <Card key={idx} size="small" style={{ background: '#fff2e8', borderColor: '#ffbb96', marginBottom: 4 }}>
                  <Paragraph style={{ margin: 0, fontSize: 13 }}>
                    <WarningOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                    {weakness}
                  </Paragraph>
                </Card>
              ))}
            </Space>
          </Card>

          {/* Gap分析 */}
          <Card title="📉 与岗位要求的差距分析" size="small" style={{ marginTop: 12 }}>
            <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>{candidate.assessment.gap_analysis}</Paragraph>
          </Card>

          {/* 邀约决策报告 */}
          <Card title="🎯 智能邀约决策" size="small" style={{ marginTop: 12 }}>
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
                {candidate.decision.salary_match || '待评估'}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>决策理由</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {candidate.decision.rationale?.map((reason, idx) => (
                <Text key={idx} style={{ fontSize: 13 }}>• {reason}</Text>
              ))}
            </Space>

            {candidate.decision.risk_factors && (
              <>
                <Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>风险因素</Title>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {candidate.decision.risk_factors.map((risk, idx) => (
                    <Text key={idx} type="warning" style={{ fontSize: 13 }}>⚠️ {risk}</Text>
                  ))}
                </Space>
              </>
            )}
          </Card>

          {/* 个性化测评方案（仅推荐候选人） */}
          {candidate.custom_assessment && (
            <Card title="📝 深度测评与面试方案" size="small" style={{ marginTop: 12 }}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header="技术深度测评题（3-5道）" key="1">
                  {candidate.custom_assessment.technical_questions?.map((q, idx) => (
                    <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{q.question}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>参考答案：</Text>{q.reference_answer}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{q.scoring_criteria}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{q.competency_assessed}</Paragraph>
                      <Paragraph style={{ marginBottom: 0 }}>
                        <Text strong type="danger">红牌警告：</Text>
                        <Text type="danger" style={{ fontSize: 13 }}>{q.red_flags}</Text>
                      </Paragraph>
                    </Card>
                  ))}
                </Panel>

                <Panel header="行为面试题（2-3道）" key="2">
                  {candidate.custom_assessment.behavioral_questions?.map((q, idx) => (
                    <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{q.question}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>预期要点：</Text>{q.expected_points}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{q.scoring_criteria}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{q.competency_assessed}</Paragraph>
                      <Paragraph style={{ marginBottom: 0 }}>
                        <Text strong type="danger">红牌警告：</Text>
                        <Text type="danger" style={{ fontSize: 13 }}>{q.red_flags}</Text>
                      </Paragraph>
                    </Card>
                  ))}
                </Panel>

                <Panel header="情景模拟题（1-2道）" key="3">
                  {candidate.custom_assessment.situational_questions?.map((q, idx) => (
                    <Card key={idx} size="small" style={{ marginBottom: 12 }}>
                      <Title level={5} style={{ marginBottom: 8 }}>题目 {idx + 1}</Title>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>场景：</Text>{q.scenario}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>问题：</Text>{q.question}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>参考答案：</Text>{q.reference_answer}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>评分标准：</Text>{q.scoring_criteria}</Paragraph>
                      <Paragraph style={{ marginBottom: 6, fontSize: 13 }}><Text strong>考察维度：</Text>{q.competency_assessed}</Paragraph>
                      <Paragraph style={{ marginBottom: 0 }}>
                        <Text strong type="danger">红牌警告：</Text>
                        <Text type="danger" style={{ fontSize: 13 }}>{q.red_flags}</Text>
                      </Paragraph>
                    </Card>
                  ))}
                </Panel>
              </Collapse>
            </Card>
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3}>评估报告</Title>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          重新评估
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}

export default ResultsDisplay;
