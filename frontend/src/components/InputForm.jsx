import { useState, useEffect } from 'react';
import { Form, Input, Upload, Button, Card, Typography, Select, message } from 'antd';
import { InboxOutlined, RocketOutlined } from '@ant-design/icons';
import {
  getActiveCompanyBackground,
  saveCompanyBackground,
  getJobPositionHistory,
  createOrUpdateJobPosition
} from '../services/databaseService';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title, Paragraph } = Typography;
const { Option } = Select;

function InputForm({ onSubmit, loading }) {
  const [form] = Form.useForm();
  const [jobHistory, setJobHistory] = useState([]);
  const [companyBackgroundId, setCompanyBackgroundId] = useState(null);

  // 从数据库加载岗位历史（数据库不可用时静默失败）
  const loadJobHistory = async () => {
    console.log('[InputForm] loadJobHistory: 开始加载岗位历史');
    try {
      const jobs = await getJobPositionHistory(20);
      console.log('[InputForm] loadJobHistory: 加载成功，数量:', jobs?.length ?? 0);
      const formattedJobs = (jobs || []).map(job => ({
        id: job.id.toString(),
        name: job.job_title,
        description: job.job_description,
        createdAt: job.created_at
      }));
      setJobHistory(formattedJobs);
    } catch (error) {
      // 数据库不可用时不报错，历史岗位功能降级为不可用
      console.warn('[InputForm] loadJobHistory: 加载失败（数据库未连接），历史岗位功能不可用。错误:', error.message);
      setJobHistory([]);
    }
  };

  // 初始化：尝试从数据库加载公司背景和岗位历史
  useEffect(() => {
    console.log('[InputForm] useEffect: 组件挂载，开始初始化');

    const loadCompanyBackground = async () => {
      console.log('[InputForm] loadCompanyBackground: 尝试从数据库加载公司背景');
      try {
        const background = await getActiveCompanyBackground();
        if (background?.content) {
          form.setFieldsValue({ companyBackground: background.content });
          setCompanyBackgroundId(background.id);
          console.log('[InputForm] loadCompanyBackground: 已从数据库填充公司背景，ID:', background.id);
        } else {
          console.log('[InputForm] loadCompanyBackground: 数据库中无公司背景记录');
        }
      } catch (error) {
        console.warn('[InputForm] loadCompanyBackground: 加载失败（数据库未连接），跳过自动填充。错误:', error.message);
      }
    };

    loadCompanyBackground();
    loadJobHistory();
  }, [form]);

  // 监听页面可见性变化时重新加载岗位历史
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[InputForm] visibilitychange: 页面重新可见，刷新岗位历史');
        loadJobHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 选择历史岗位
  const handleJobSelect = (value) => {
    const selectedJob = jobHistory.find(job => job.id === value);
    if (selectedJob) {
      console.log('[InputForm] handleJobSelect: 选择历史岗位:', selectedJob.name);
      form.setFieldsValue({
        jobTitle: selectedJob.name,
        jobDescription: selectedJob.description
      });
      message.success(`已填充岗位：${selectedJob.name}`);
    }
  };

  // 提交表单 —— 唯一触发 API 调用的入口
  const handleFinish = async (values) => {
    console.log('[InputForm] handleFinish: 用户点击"开始智能评估"，开始提交');
    console.log('[InputForm] handleFinish: 公司背景长度:', values.companyBackground?.length);
    console.log('[InputForm] handleFinish: 岗位名称:', values.jobTitle);
    console.log('[InputForm] handleFinish: 岗位JD长度:', values.jobDescription?.length);
    console.log('[InputForm] handleFinish: 简历文件数量:', values.resumes?.length);

    const jobTitle = values.jobTitle;
    const jobDesc = values.jobDescription;
    const companyBg = values.companyBackground;

    // 尝试保存公司背景到数据库（可选，失败不阻断评估）
    if (companyBg) {
      try {
        console.log('[InputForm] handleFinish: 尝试保存公司背景到数据库...');
        const saved = await saveCompanyBackground(companyBg);
        if (saved?.id) {
          setCompanyBackgroundId(saved.id);
          console.log('[InputForm] handleFinish: 公司背景保存成功，ID:', saved.id);
        }
      } catch (error) {
        console.warn('[InputForm] handleFinish: 公司背景保存失败（数据库未连接），不影响评估。错误:', error.message);
      }
    }

    // 尝试保存岗位到数据库（可选，失败不阻断评估）
    if (jobTitle && jobDesc) {
      try {
        console.log('[InputForm] handleFinish: 尝试保存岗位到数据库，岗位名称:', jobTitle);
        await createOrUpdateJobPosition(jobTitle, jobDesc, companyBackgroundId);
        console.log('[InputForm] handleFinish: 岗位保存成功');
        await loadJobHistory();
      } catch (error) {
        console.warn('[InputForm] handleFinish: 岗位保存失败（数据库未连接），不影响评估。错误:', error.message);
      }
    }

    // 调用父组件的评估逻辑（核心流程）
    console.log('[InputForm] handleFinish: 开始调用评估接口 /api/assess');
    onSubmit(values);
  };

  const uploadProps = {
    name: 'resumes',
    multiple: true,
    beforeUpload: () => false,
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.bmp',
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>输入评估信息</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        style={{ maxWidth: 1000 }}
      >
        {/* 输入框1: 公司背景 + 岗位JD */}
        <Card
          title="📋 输入框1: 公司背景 + 岗位JD要求"
          style={{ marginBottom: 16 }}
        >
          <Form.Item
            name="companyBackground"
            label="公司背景"
            rules={[{ required: true, message: '请输入公司背景信息' }]}
            style={{ marginBottom: 16 }}
          >
            <TextArea
              rows={3}
              placeholder="请输入公司业务领域、发展阶段、团队文化、技术栈等信息&#x0a;&#x0a;例如：&#x0a;我们是一家专注于人工智能技术的创业公司，目前处于快速发展期。团队规模50人，技术团队占比60%。主要业务方向是智能对话系统和知识图谱。技术栈包括Python、React、PostgreSQL等。团队氛围开放创新，鼓励技术分享和自主学习。"
            />
          </Form.Item>

          <Form.Item
            label="岗位名称"
            style={{ marginBottom: 16 }}
            required
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item
                name="jobTitle"
                rules={[{ required: true, message: '请输入岗位名称' }]}
                style={{ marginBottom: 0, flex: 1 }}
              >
                <Input
                  placeholder="请输入岗位名称,例如:高级AI应用工程师"
                  style={{ fontSize: 14 }}
                />
              </Form.Item>
              <Select
                placeholder="历史岗位"
                style={{ width: 160 }}
                onChange={handleJobSelect}
                onDropdownVisibleChange={(open) => {
                  if (open) {
                    console.log('[InputForm] Select: 下拉菜单打开，刷新岗位历史');
                    loadJobHistory();
                  }
                }}
                allowClear
                showSearch
                optionFilterProp="children"
                suffixIcon={<span style={{ fontSize: 12 }}>🔄 {jobHistory.length}</span>}
                notFoundContent="暂无历史岗位"
              >
                {jobHistory.map((job, index) => (
                  <Option
                    key={job.id}
                    value={job.id}
                    title={`${job.name}\n\n岗位详情:\n${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}`}
                  >
                    {job.name} {jobHistory.filter(j => j.name === job.name).length > 1 ? `(版本${index + 1})` : ''}
                  </Option>
                ))}
              </Select>
            </div>
          </Form.Item>

          <Form.Item
            label="岗位JD要求"
            name="jobDescription"
            rules={[{ required: true, message: '请输入岗位JD' }]}
            style={{ marginBottom: 0 }}
          >
            <TextArea
              rows={6}
              placeholder="请输入详细的岗位职责和任职要求&#x0a;&#x0a;例如：&#x0a;职位：高级全栈工程师&#x0a;&#x0a;岗位职责：&#x0a;1. 负责公司核心产品的前后端开发&#x0a;2. 参与系统架构设计和技术选型&#x0a;3. 优化系统性能，提升用户体验&#x0a;&#x0a;任职要求：&#x0a;1. 3年以上全栈开发经验&#x0a;2. 精通React、Node.js&#x0a;3. 熟悉数据库设计和优化&#x0a;4. 良好的沟通能力和团队协作精神"
              style={{ position: 'relative', zIndex: 1 }}
            />
          </Form.Item>
        </Card>

        {/* 输入框2: 上传简历 */}
        <Card title="📄 输入框2: 上传候选人简历" style={{ marginBottom: 16 }}>
          <Form.Item
            name="resumes"
            rules={[{ required: true, message: '请至少上传一份简历' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            style={{ marginBottom: 8 }}
          >
            <Dragger {...uploadProps} style={{ padding: '16px' }}>
              <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                <InboxOutlined />
              </p>
              <p className="ant-upload-text" style={{ marginBottom: 4 }}>点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint" style={{ marginBottom: 0 }}>
                支持批量上传PDF、Word格式的简历文件（最多20份）
              </p>
            </Dragger>
          </Form.Item>

          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
            💡 提示：系统支持OCR识别，可自动解析扫描版PDF/Word简历
          </Paragraph>
        </Card>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<RocketOutlined />}
            size="large"
            loading={loading}
            block
            style={{ height: 44, fontSize: 15 }}
          >
            {loading ? 'AI分析中...' : '开始智能评估'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default InputForm;
