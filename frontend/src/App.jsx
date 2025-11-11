import React, { useState } from 'react';
import { Layout, Typography, Card, Steps, message } from 'antd';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentResult, setAssessmentResult] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setCurrentStep(1);

    try {
      // 构建FormData
      const submitData = new FormData();
      submitData.append('companyBackground', formData.companyBackground);
      submitData.append('jobDescription', formData.jobDescription);

      // 添加所有简历文件
      formData.resumes.forEach((file) => {
        submitData.append('resumes', file.originFileObj);
      });

      // 发送请求
      const response = await axios.post('/api/assess', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('📊 收到评估结果:', response.data.data);
        setAssessmentResult(response.data.data);
        setCurrentStep(2);
        message.success('评估完成！');
      } else {
        throw new Error(response.data.error || '评估失败');
      }
    } catch (error) {
      console.error('评估失败:', error);
      message.error(error.response?.data?.error || error.message || '评估失败，请稍后重试');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAssessmentResult(null);
    setCurrentStep(0);
  };

  const steps = [
    { title: '输入信息', description: '填写岗位要求和上传简历' },
    { title: 'AI分析中', description: '深度评估候选人' },
    { title: '查看报告', description: '完整评估结果' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 50px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ margin: '14px 0', color: '#1890ff' }}>
          路之音智能人才评估与面试决策系统
        </Title>
      </Header>

      <Content style={{ padding: '50px' }}>
        <Card style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

          {currentStep === 0 && (
            <InputForm onSubmit={handleSubmit} loading={loading} />
          )}

          {currentStep === 1 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="loading-spinner"></div>
              <Title level={4} style={{ marginTop: 20 }}>AI正在深度分析中，请稍候...</Title>
              <p style={{ color: '#666', marginTop: 10 }}>
                正在进行岗位能力分析、简历解析、多维评估和测评题生成
              </p>
            </div>
          )}

          {currentStep === 2 && assessmentResult && (
            <ResultsDisplay data={assessmentResult} onReset={handleReset} />
          )}
        </Card>
      </Content>
    </Layout>
  );
}

export default App;
