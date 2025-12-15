import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Typography, Space, Card, Tag } from 'antd';
import {
  RocketOutlined,
  FileSearchOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  FileWordOutlined,
  CheckCircleOutlined,
  RightOutlined,
  LeftOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const WelcomeGuide = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const guideSteps = [
    {
      title: '欢迎使用路之音智能人才评估系统',
      icon: <RocketOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      content: (
        <div style={{ textAlign: 'center', padding: '6px 0' }}>
          <Title level={3} style={{ color: '#1890ff', marginTop: 4, marginBottom: 8, fontSize: 18 }}>
            🎯 路之音智能人才评估系统
          </Title>
          <Paragraph style={{ fontSize: 14, marginTop: 8, marginBottom: 6 }}>
            基于AI大模型的智能招聘解决方案
          </Paragraph>
          <Paragraph style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
            通过AI技术快速筛选候选人,提升招聘效率,降低招聘成本
          </Paragraph>

          <Space direction="vertical" size={6} style={{ marginTop: 10, width: '100%' }}>
            <Card size="small" style={{ background: 'rgba(24, 144, 255, 0.05)', marginBottom: 0 }}>
              <Space size={8}>
                <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13 }}>智能化</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>AI驱动的候选人评估</Text>
              </Space>
            </Card>
            <Card size="small" style={{ background: 'rgba(82, 196, 26, 0.05)', marginBottom: 0 }}>
              <Space size={8}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13 }}>精准化</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>多维度岗位匹配分析</Text>
              </Space>
            </Card>
            <Card size="small" style={{ background: 'rgba(250, 140, 22, 0.05)', marginBottom: 0 }}>
              <Space size={8}>
                <BarChartOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
                <Text strong style={{ fontSize: 13 }}>数据化</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>可视化评估报告输出</Text>
              </Space>
            </Card>
          </Space>
        </div>
      )
    },
    {
      title: '核心功能介绍',
      icon: <FileSearchOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      content: (
        <div style={{ padding: '6px 0' }}>
          <Title level={4} style={{ color: '#52c41a', textAlign: 'center', marginBottom: 10, marginTop: 4, fontSize: 15 }}>
            📋 系统核心功能
          </Title>

          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Card hoverable size="small" style={{ marginBottom: 0 }}>
              <Space direction="vertical" size={2}>
                <Space size={6}>
                  <Tag color="blue" style={{ fontSize: 12, padding: '0 6px' }}>1</Tag>
                  <Text strong style={{ fontSize: 13 }}>智能简历解析</Text>
                </Space>
                <Paragraph style={{ marginBottom: 0, marginLeft: 24, color: '#666', fontSize: 12, lineHeight: 1.3 }}>
                  支持PDF、Word、TXT、JPG/PNG图片格式<br/>
                  自动OCR识别扫描件简历,提取关键信息
                </Paragraph>
              </Space>
            </Card>

            <Card hoverable size="small" style={{ marginBottom: 0 }}>
              <Space direction="vertical" size={2}>
                <Space size={6}>
                  <Tag color="green" style={{ fontSize: 12, padding: '0 6px' }}>2</Tag>
                  <Text strong style={{ fontSize: 13 }}>AI岗位分析</Text>
                </Space>
                <Paragraph style={{ marginBottom: 0, marginLeft: 24, color: '#666', fontSize: 12, lineHeight: 1.3 }}>
                  智能解析岗位需求,提取核心能力维度<br/>
                  自动分配技能权重,识别硬性要求
                </Paragraph>
              </Space>
            </Card>

            <Card hoverable size="small" style={{ marginBottom: 0 }}>
              <Space direction="vertical" size={2}>
                <Space size={6}>
                  <Tag color="orange" style={{ fontSize: 12, padding: '0 6px' }}>3</Tag>
                  <Text strong style={{ fontSize: 13 }}>候选人评估</Text>
                </Space>
                <Paragraph style={{ marginBottom: 0, marginLeft: 24, color: '#666', fontSize: 12, lineHeight: 1.3 }}>
                  技术匹配度、经验匹配度、文化契合度<br/>
                  综合评分、优劣势分析、差距分析
                </Paragraph>
              </Space>
            </Card>

            <Card hoverable size="small" style={{ marginBottom: 0 }}>
              <Space direction="vertical" size={2}>
                <Space size={6}>
                  <Tag color="purple" style={{ fontSize: 12, padding: '0 6px' }}>4</Tag>
                  <Text strong style={{ fontSize: 13 }}>智能决策建议</Text>
                </Space>
                <Paragraph style={{ marginBottom: 0, marginLeft: 24, color: '#666', fontSize: 12, lineHeight: 1.3 }}>
                  推荐等级(强烈推荐/推荐/待定/不推荐)<br/>
                  置信度评估、预期成功率、风险因素分析
                </Paragraph>
              </Space>
            </Card>
          </Space>
        </div>
      )
    },
    {
      title: '使用流程',
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      content: (
        <div style={{ padding: '6px 0' }}>
          <Title level={4} style={{ color: '#fa8c16', textAlign: 'center', marginBottom: 10, marginTop: 4, fontSize: 15 }}>
            🚀 三步完成智能评估
          </Title>

          <Steps
            direction="vertical"
            current={3}
            size="small"
            items={[
              {
                title: <span style={{ fontSize: 13 }}>填写岗位需求</span>,
                description: <span style={{ fontSize: 12 }}>输入岗位名称、职责描述、任职要求等信息</span>,
                icon: <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#1890ff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>1</div>
              },
              {
                title: <span style={{ fontSize: 13 }}>上传候选人简历</span>,
                description: <span style={{ fontSize: 12 }}>批量上传多份候选人简历(支持PDF/Word/图片格式)</span>,
                icon: <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#52c41a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>2</div>
              },
              {
                title: <span style={{ fontSize: 13 }}>查看评估报告</span>,
                description: <span style={{ fontSize: 12 }}>实时查看AI评估结果,可导出Word格式报告</span>,
                icon: <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#fa8c16',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>3</div>
              }
            ]}
          />

          <Card
            size="small"
            style={{
              marginTop: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              marginBottom: 0
            }}
          >
            <Space size={8}>
              <FileWordOutlined style={{ fontSize: 18 }} />
              <div>
                <Text strong style={{ color: 'white', fontSize: 13 }}>
                  评估完成后可导出专业报告
                </Text>
                <br/>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                  支持Word格式,包含岗位分析、候选人对比、详细评估等完整内容
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      )
    },
    {
      title: '开始使用',
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      content: (
        <div style={{ textAlign: 'center', padding: '6px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 10 }} />
          <Title level={3} style={{ color: '#52c41a', marginTop: 4, marginBottom: 8, fontSize: 18 }}>
            准备就绪!
          </Title>
          <Paragraph style={{ fontSize: 13, marginTop: 6, marginBottom: 12 }}>
            现在您可以开始使用路之音智能人才评估系统了
          </Paragraph>

          <Card
            size="small"
            style={{
              marginTop: 10,
              background: 'rgba(24, 144, 255, 0.05)',
              textAlign: 'left',
              marginBottom: 0
            }}
          >
            <Title level={5} style={{ marginBottom: 8, marginTop: 2, fontSize: 13 }}>💡 使用提示:</Title>
            <Paragraph style={{ marginBottom: 5, fontSize: 12, lineHeight: 1.4 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 5, fontSize: 11 }} />
              简历文件建议不超过10MB,系统支持批量上传最多20份
            </Paragraph>
            <Paragraph style={{ marginBottom: 5, fontSize: 12, lineHeight: 1.4 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 5, fontSize: 11 }} />
              岗位描述越详细,AI评估结果越精准
            </Paragraph>
            <Paragraph style={{ marginBottom: 5, fontSize: 12, lineHeight: 1.4 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 5, fontSize: 11 }} />
              可使用"历史记录"功能查看往期评估结果
            </Paragraph>
            <Paragraph style={{ marginBottom: 0, fontSize: 12, lineHeight: 1.4 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 5, fontSize: 11 }} />
              评估过程需要1-3分钟,请耐心等待
            </Paragraph>
          </Card>

          <div style={{ marginTop: 14 }}>
            <Button
              type="primary"
              size="large"
              onClick={() => setVisible(false)}
              style={{
                height: 38,
                fontSize: 14,
                borderRadius: 19,
                paddingLeft: 28,
                paddingRight: 28
              }}
            >
              立即开始使用 🚀
            </Button>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setCurrentStep(0); // 重置步骤
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={680}
      centered
      bodyStyle={{ padding: '20px 28px 16px' }}
      closeIcon={<span style={{ fontSize: 16 }}>✕</span>}
    >
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        {guideSteps[currentStep].icon}
      </div>

      {guideSteps[currentStep].content}

      {currentStep < guideSteps.length - 1 && (
        <div style={{ marginTop: 12 }}>
          <Steps
            current={currentStep}
            size="small"
            items={guideSteps.map((step, index) => ({
              title: index === currentStep ? step.title : ''
            }))}
          />
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #f0f0f0',
          paddingTop: 12
        }}
      >
        <Button
          onClick={handlePrev}
          disabled={currentStep === 0}
          icon={<LeftOutlined />}
        >
          上一步
        </Button>

        <Space>
          <Button onClick={handleClose}>
            跳过引导
          </Button>
          {currentStep < guideSteps.length - 1 ? (
            <Button
              type="primary"
              onClick={handleNext}
              icon={<RightOutlined />}
              iconPosition="end"
            >
              下一步
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleClose}
              size="large"
            >
              开始使用
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default WelcomeGuide;
