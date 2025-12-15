import axios from 'axios';

// 基础API配置
const API_BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * =====================================
 * 公司背景相关API
 * =====================================
 */

// 获取当前激活的公司背景
export const getActiveCompanyBackground = async () => {
  try {
    const result = await apiClient.get('/data/company-background');
    return result.data;
  } catch (error) {
    console.error('获取公司背景失败:', error);
    return null;
  }
};

// 保存公司背景
export const saveCompanyBackground = async (content) => {
  try {
    const result = await apiClient.post('/data/company-background', { content });
    return result.data;
  } catch (error) {
    console.error('保存公司背景失败:', error);
    throw error;
  }
};

// 获取公司背景历史
export const getCompanyBackgroundHistory = async (limit = 10) => {
  try {
    const result = await apiClient.get('/data/company-background/history', {
      params: { limit },
    });
    return result.data || [];
  } catch (error) {
    console.error('获取公司背景历史失败:', error);
    return [];
  }
};

/**
 * =====================================
 * 岗位信息相关API
 * =====================================
 */

// 获取岗位历史列表
export const getJobPositionHistory = async (limit = 20) => {
  try {
    const result = await apiClient.get('/data/job-positions', {
      params: { limit },
    });
    return result.data || [];
  } catch (error) {
    console.error('获取岗位历史失败:', error);
    return [];
  }
};

// 创建或更新岗位
export const createOrUpdateJobPosition = async (jobTitle, jobDescription, companyBackgroundId = null) => {
  try {
    const result = await apiClient.post('/data/job-positions', {
      jobTitle,
      jobDescription,
      companyBackgroundId,
    });
    return result.data;
  } catch (error) {
    console.error('保存岗位失败:', error);
    throw error;
  }
};

// 获取岗位详情
export const getJobPositionById = async (id) => {
  try {
    const result = await apiClient.get(`/data/job-positions/${id}`);
    return result.data;
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    return null;
  }
};

// 搜索岗位
export const searchJobPositions = async (term, limit = 10) => {
  try {
    const result = await apiClient.get(`/data/job-positions/search/${term}`, {
      params: { limit },
    });
    return result.data || [];
  } catch (error) {
    console.error('搜索岗位失败:', error);
    return [];
  }
};

/**
 * =====================================
 * 评估报告相关API
 * =====================================
 */

// 保存完整的评估报告
export const saveAssessmentReport = async (reportData, candidatesData) => {
  try {
    const result = await apiClient.post('/data/assessment-reports', {
      reportData,
      candidatesData,
    });
    return result.data;
  } catch (error) {
    console.error('保存评估报告失败:', error);
    throw error;
  }
};

// 获取评估报告详情
export const getAssessmentReportById = async (id) => {
  try {
    const result = await apiClient.get(`/data/assessment-reports/${id}`);
    return result.data;
  } catch (error) {
    console.error('获取评估报告失败:', error);
    return null;
  }
};

// 获取评估历史列表
export const getAssessmentHistory = async (limit = 20) => {
  try {
    const result = await apiClient.get('/data/assessment-history', {
      params: { limit },
    });
    return result.data || [];
  } catch (error) {
    console.error('获取评估历史失败:', error);
    return [];
  }
};

/**
 * =====================================
 * 健康检查
 * =====================================
 */

// 检查数据库连接状态
export const checkDatabaseHealth = async () => {
  try {
    const result = await apiClient.get('/data/health');
    return result;
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return { success: false, connected: false };
  }
};

export default {
  // 公司背景
  getActiveCompanyBackground,
  saveCompanyBackground,
  getCompanyBackgroundHistory,

  // 岗位信息
  getJobPositionHistory,
  createOrUpdateJobPosition,
  getJobPositionById,
  searchJobPositions,

  // 评估报告
  saveAssessmentReport,
  getAssessmentReportById,
  getAssessmentHistory,

  // 健康检查
  checkDatabaseHealth,
};
