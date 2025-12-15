import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Steps, message, Modal, Table, Button, Space, Progress } from 'antd';
import { HistoryOutlined, EyeOutlined, DeleteOutlined, FileWordOutlined, QuestionCircleOutlined, HomeOutlined } from '@ant-design/icons';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import WelcomeGuide from './components/WelcomeGuide';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [ws, setWs] = useState(null);
  const [guideVisible, setGuideVisible] = useState(false);

  // 检查是否首次访问,显示引导页
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBefore');
    if (!hasVisited) {
      setGuideVisible(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  // 从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('assessmentHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        console.log('📚 加载历史记录，总数:', history.length);

        // 验证并过滤掉不完整的历史记录
        const validHistory = history.filter((item, index) => {
          const isValid = item.data &&
            item.data.job_analysis &&
            item.data.candidates_overview &&
            item.data.candidates_detail;

          if (!isValid) {
            console.warn(`⚠️ 历史记录 ${index + 1} 数据不完整，已自动跳过`, {
              hasJobAnalysis: !!item.data?.job_analysis,
              hasCandidatesOverview: !!item.data?.candidates_overview,
              hasCandidatesDetail: !!item.data?.candidates_detail
            });
          }

          return isValid;
        });

        if (validHistory.length < history.length) {
          console.log(`🧹 清理了 ${history.length - validHistory.length} 条不完整的历史记录`);
          // 保存清理后的历史记录
          localStorage.setItem('assessmentHistory', JSON.stringify(validHistory));
          message.info(`已自动清理 ${history.length - validHistory.length} 条不完整的历史记录`);
        }

        setReportHistory(validHistory);
      } catch (error) {
        console.error('❌ 加载历史记录失败:', error);
        setReportHistory([]);
      }
    }
  }, []);

  // WebSocket连接
  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('✅ WebSocket连接成功');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 收到WebSocket消息:', data);

        if (data.type === 'progress') {
          setProgressMessage(data.message);
          setProgressPercent(data.progress);
        } else if (data.type === 'complete') {
          setProgressMessage('评估完成！');
          setProgressPercent(100);
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket连接关闭');
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  // 保存报告到历史记录
  const saveToHistory = (reportData) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      data: reportData,
      candidateCount: reportData.candidates_overview?.length || 0
    };

    const newHistory = [historyItem, ...reportHistory];
    setReportHistory(newHistory);
    localStorage.setItem('assessmentHistory', JSON.stringify(newHistory));
  };

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

      // 发送请求（设置超时时间为5分钟，因为AI分析需要较长时间）
      const response = await axios.post('/api/assess', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5分钟超时（300秒）
      });

      if (response.data.success) {
        console.log('📊 收到评估结果:', response.data.data);
        setAssessmentResult(response.data.data);
        setCurrentStep(2);
        message.success('评估完成！');

        // 保存到历史记录
        saveToHistory(response.data.data);
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

  // 查看历史报告
  const viewHistoryReport = (record) => {
    try {
      console.log('🔍 加载历史报告 - 原始数据:', record);
      console.log('🔍 报告数据结构:', JSON.stringify(record.data, null, 2));

      // 验证数据结构
      if (!record.data) {
        throw new Error('报告数据为空');
      }

      if (!record.data.job_analysis) {
        console.error('❌ 缺少 job_analysis 字段');
        throw new Error('缺少岗位分析数据');
      }

      if (!record.data.candidates_overview || !Array.isArray(record.data.candidates_overview)) {
        console.error('❌ 缺少 candidates_overview 字段或格式错误:', record.data.candidates_overview);
        throw new Error('缺少候选人概览数据');
      }

      if (!record.data.candidates_detail || !Array.isArray(record.data.candidates_detail)) {
        console.error('❌ 缺少 candidates_detail 字段或格式错误:', record.data.candidates_detail);
        console.error('📋 完整数据结构的键:', Object.keys(record.data));

        // 提示用户清理旧数据
        Modal.warning({
          title: '历史数据格式不兼容',
          content: '此历史记录缺少候选人详细信息数据，可能是旧版本生成的报告。建议删除此记录并重新生成评估报告。',
          okText: '知道了'
        });

        throw new Error('缺少候选人详情数据（可能是旧版本数据）');
      }

      console.log('✅ 数据验证通过，开始加载报告');
      console.log('📊 candidates_detail 数量:', record.data.candidates_detail.length);

      setHistoryModalVisible(false);
      setAssessmentResult(record.data);
      setCurrentStep(2);
      message.success('已加载历史报告');
    } catch (error) {
      console.error('❌ 加载历史报告失败:', error);
      message.error(`加载失败: ${error.message}`);
    }
  };

  // 下载报告为Word
  const downloadReportWord = async (record) => {
    try {
      message.loading('正在生成Word文档...', 0);
      const response = await axios.post('/api/export-word', record.data, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `评估报告_${record.timestamp.replace(/[/:]/g, '-')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.destroy();
      message.success('Word报告已下载');
    } catch (error) {
      message.destroy();
      console.error('下载Word失败:', error);
      message.error('Word下载失败: ' + (error.response?.data?.error || error.message));
    }
  };

  // 删除历史记录
  const deleteHistoryReport = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const newHistory = reportHistory.filter(item => item.id !== id);
        setReportHistory(newHistory);
        localStorage.setItem('assessmentHistory', JSON.stringify(newHistory));
        message.success('已删除');
      }
    });
  };

  // 历史记录表格列定义
  const historyColumns = [
    {
      title: '生成时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
    },
    {
      title: '候选人数量',
      dataIndex: 'candidateCount',
      key: 'candidateCount',
      width: 120,
      render: (count) => `${count} 人`
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewHistoryReport(record)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<FileWordOutlined />}
            onClick={() => downloadReportWord(record)}
          >
            下载Word
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => deleteHistoryReport(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  const steps = [
    { title: '输入信息', description: '填写岗位要求和上传简历' },
    { title: 'AI分析中', description: '深度评估候选人' },
    { title: '查看报告', description: '完整评估结果' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 系统引导页 */}
      <WelcomeGuide
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
      />

      <Header style={{ background: '#fff', padding: '0 40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: '12px 0', color: '#1890ff' }}>
          路之音智能人才评估与面试决策系统
        </Title>
        <Space size="middle">
          <Button
            icon={<QuestionCircleOutlined />}
            onClick={() => setGuideVisible(true)}
            size="large"
          >
            使用引导
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => setHistoryModalVisible(true)}
            size="large"
          >
            报告历史 ({reportHistory.length})
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '30px 40px' }}>
        <Card style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 评估结果页面显示返回按钮 */}
          {currentStep === 2 && (
            <div style={{ marginBottom: 16 }}>
              <Button
                icon={<HomeOutlined />}
                onClick={handleReset}
                size="large"
                type="primary"
              >
                返回首页继续评估
              </Button>
            </div>
          )}

          <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

          {currentStep === 0 && (
            <InputForm onSubmit={handleSubmit} loading={loading} />
          )}

          {currentStep === 1 && (
            <div style={{ textAlign: 'center', padding: '50px 0', maxWidth: 600, margin: '0 auto' }}>
              <div className="loading-spinner"></div>
              <Title level={4} style={{ marginTop: 16, marginBottom: 16 }}>AI正在深度分析中，请稍候...</Title>

              {/* 实时进度条 */}
              <Progress
                percent={progressPercent}
                status={progressPercent === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ marginBottom: 16 }}
              />

              {/* 实时进度消息 */}
              <p style={{ color: '#666', fontSize: 14, minHeight: 22 }}>
                {progressMessage || '正在进行岗位能力分析、简历解析、多维评估和测评题生成'}
              </p>
            </div>
          )}

          {currentStep === 2 && assessmentResult && (
            <ResultsDisplay data={assessmentResult} onReset={handleReset} />
          )}
        </Card>
      </Content>

      {/* 历史记录弹窗 */}
      <Modal
        title={<><HistoryOutlined /> 报告历史记录</>}
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={null}
        width={800}
      >
        {reportHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无历史记录
          </div>
        ) : (
          <Table
            columns={historyColumns}
            dataSource={reportHistory}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        )}
      </Modal>
    </Layout>
  );
}

export default App;
