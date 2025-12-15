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

  // 从数据库加载岗位历史
  const loadJobHistory = async () => {
    console.log('=== 📖 开始加载岗位历史 ===');
    console.log('   时间:', new Date().toLocaleString());

    try {
      console.log('📡 调用API: getJobPositionHistory(20)');
      const jobs = await getJobPositionHistory(20);
      console.log('✅ API返回数据:', jobs);
      console.log('   数据类型:', Array.isArray(jobs) ? 'Array' : typeof jobs);
      console.log('   数据长度:', jobs?.length);

      if (jobs && jobs.length > 0) {
        console.log('   第一条数据示例:', JSON.stringify(jobs[0], null, 2));
      }

      // 转换为前端需要的格式
      const formattedJobs = jobs.map(job => ({
        id: job.id.toString(),
        name: job.job_title,
        description: job.job_description,
        createdAt: job.created_at
      }));

      setJobHistory(formattedJobs);
      console.log('📊 格式化后岗位数量:', formattedJobs.length);
      console.log('=== ✅ 岗位历史加载完成 ===');
    } catch (error) {
      console.error('=== ❌ 加载岗位历史失败 ===');
      console.error('   错误类型:', error.name);
      console.error('   错误消息:', error.message);
      console.error('   错误堆栈:', error.stack);
      message.error('加载岗位历史失败');
      setJobHistory([]);
    }
  };

  // 初始化:加载公司背景和岗位历史
  useEffect(() => {
    console.log('=== 🔄 InputForm组件初始化 ===');
    console.log('   挂载时间:', new Date().toLocaleString());

    // 从数据库加载公司背景
    const loadCompanyBackground = async () => {
      console.log('📖 开始加载公司背景...');
      try {
        console.log('📡 调用API: getActiveCompanyBackground()');
        const background = await getActiveCompanyBackground();
        console.log('📦 API返回结果:', background);

        if (background) {
          console.log('   背景ID:', background.id);
          console.log('   内容长度:', background.content?.length);
          console.log('   内容预览:', background.content?.substring(0, 50) + '...');

          form.setFieldsValue({ companyBackground: background.content });
          setCompanyBackgroundId(background.id);
          console.log('✅ 公司背景已填充到表单');
        } else {
          console.log('⚠️ 数据库中没有公司背景');
        }
      } catch (error) {
        console.error('❌ 加载公司背景失败:', error);
        console.error('   错误详情:', error.message);
      }
    };

    console.log('📌 开始并行加载公司背景和岗位历史...');
    loadCompanyBackground();
    loadJobHistory();
    console.log('=== ✅ 初始化加载任务已启动 ===');
  }, [form]);

  // 监听组件显示时重新加载岗位历史
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 页面重新可见,重新加载岗位历史');
        loadJobHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 保存公司背景到数据库
  const handleCompanyBackgroundChange = async (e) => {
    const value = e.target.value;
    console.log('📝 公司背景输入变化, 长度:', value.length);
    console.log('   内容预览:', value.substring(0, 50) + (value.length > 50 ? '...' : ''));

    try {
      console.log('💾 开始保存公司背景到数据库...');
      const saved = await saveCompanyBackground(value);
      console.log('📦 数据库返回结果:', saved);

      if (saved) {
        setCompanyBackgroundId(saved.id);
        console.log('✅ 公司背景已保存到数据库, ID:', saved.id);
      } else {
        console.warn('⚠️ 保存返回结果为空');
      }
    } catch (error) {
      console.error('❌ 保存公司背景失败:', error);
      console.error('   错误详情:', error.message);
      console.error('   错误响应:', error.response?.data);
    }
  };

  // 选择历史岗位
  const handleJobSelect = (value) => {
    const selectedJob = jobHistory.find(job => job.id === value);
    if (selectedJob) {
      form.setFieldsValue({
        jobTitle: selectedJob.name,
        jobDescription: selectedJob.description
      });
      message.success(`已填充岗位：${selectedJob.name}`);
    }
  };

  // 提交表单
  const handleFinish = async (values) => {
    console.log('=== 🚀 开始提交表单 ===');
    console.log('📋 表单所有字段值:', JSON.stringify(values, null, 2));
    console.log('📝 岗位名称 (jobTitle):', values.jobTitle);
    console.log('📄 岗位描述 (jobDescription):', values.jobDescription?.substring(0, 100) + '...');
    console.log('🏢 公司背景 (companyBackground):', values.companyBackground?.substring(0, 100) + '...');
    console.log('📎 简历文件 (resumes):', values.resumes);
    console.log('🆔 当前公司背景ID:', companyBackgroundId);

    const jobTitle = values.jobTitle;
    const jobDesc = values.jobDescription;

    console.log('🔍 校验: jobTitle存在?', !!jobTitle, '| jobDesc存在?', !!jobDesc);

    // 保存岗位到数据库
    if (jobTitle && jobDesc) {
      try {
        console.log('💾 准备保存岗位到数据库...');
        console.log('   - 岗位名称:', jobTitle);
        console.log('   - 公司背景ID:', companyBackgroundId);
        await createOrUpdateJobPosition(jobTitle, jobDesc, companyBackgroundId);
        console.log('✅ 岗位已成功保存到数据库');

        // 重新加载岗位历史
        console.log('🔄 重新加载岗位历史...');
        await loadJobHistory();
        message.success('岗位信息已保存');
      } catch (error) {
        console.error('❌ 保存岗位失败:', error);
        console.error('   错误详情:', error.message);
        console.error('   错误堆栈:', error.stack);
        message.error('保存岗位失败');
      }
    } else {
      console.warn('⚠️ 跳过保存岗位: jobTitle或jobDesc为空');
    }

    // 调用原有的提交逻辑
    console.log('📤 调用父组件的onSubmit函数...');
    onSubmit(values);
    console.log('=== ✅ 表单提交完成 ===');
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
              onChange={handleCompanyBackgroundChange}
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
                onFocus={() => {
                  console.log('🖱️ Select获得焦点,重新加载岗位历史');
                  loadJobHistory();
                }}
                onDropdownVisibleChange={(open) => {
                  if (open) {
                    console.log('📂 下拉菜单打开,重新加载岗位历史');
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
