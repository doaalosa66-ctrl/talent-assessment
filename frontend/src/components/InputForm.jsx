import React from 'react';
import { Form, Input, Upload, Button, Card, Typography } from 'antd';
import { InboxOutlined, RocketOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

function InputForm({ onSubmit, loading }) {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    onSubmit(values);
  };

  const uploadProps = {
    name: 'resumes',
    multiple: true,
    beforeUpload: () => false, // 阻止自动上传
    accept: '.pdf,.doc,.docx,.txt',
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
        <Card title="📋 输入框1: 公司背景 + 岗位JD要求" style={{ marginBottom: 16 }}>
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
            name="jobDescription"
            label="岗位JD要求"
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
                支持批量上传PDF、Word或TXT格式的简历文件（最多20份）
              </p>
            </Dragger>
          </Form.Item>

          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}>
            提示：系统将自动解析简历内容，提取候选人的技能、经验、项目等关键信息
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
