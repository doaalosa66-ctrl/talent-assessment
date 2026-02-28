import React, { useState } from 'react';
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './Login.css'; // 复用登录页面的样式

const Register = ({ onRegisterSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // 实时验证函数
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'username':
        if (!value.trim()) {
          error = '用户名不能为空';
        } else if (value.length < 3) {
          error = '用户名至少需要3个字符';
        } else if (value.length > 20) {
          error = '用户名不能超过20个字符';
        } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(value)) {
          error = '用户名只能包含字母、数字、下划线和中文';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = '邮箱不能为空';
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = '请输入有效的邮箱地址';
          }
        }
        break;

      case 'phone':
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          error = '请输入有效的手机号码';
        }
        break;

      case 'password':
        if (!value) {
          error = '密码不能为空';
        } else if (value.length < 6) {
          error = '密码至少需要6位字符';
        } else if (value.length > 20) {
          error = '密码不能超过20个字符';
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
          error = '密码必须包含字母和数字';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = '请确认密码';
        } else if (value !== formData.password) {
          error = '两次输入的密码不一致';
        }
        break;

      default:
        break;
    }

    return error;
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 实时验证
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    // 如果修改了密码，也要重新验证确认密码
    if (name === 'password' && formData.confirmPassword) {
      const confirmError = formData.confirmPassword !== value ? '两次输入的密码不一致' : '';
      setErrors(prev => ({
        ...prev,
        confirmPassword: confirmError
      }));
    }
  };

  // 表单提交前验证
  const validateForm = () => {
    const usernameError = validateField('username', formData.username);
    const emailError = validateField('email', formData.email);
    const phoneError = validateField('phone', formData.phone);
    const passwordError = validateField('password', formData.password);
    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);

    setErrors({
      username: usernameError,
      email: emailError,
      phone: phoneError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    });

    return !usernameError && !emailError && !phoneError && !passwordError && !confirmPasswordError;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      message.warning('请检查表单输入');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('注册成功！正在跳转登录...');

        // 延迟1秒后跳转到登录页
        setTimeout(() => {
          if (onRegisterSuccess) {
            onRegisterSuccess(data.data);
          }
        }, 1000);
      } else {
        message.error(data.error || '注册失败，请稍后重试');
      }
    } catch (error) {
      console.error('注册失败:', error);
      message.error('注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-shape shape1"></div>
        <div className="background-shape shape2"></div>
        <div className="background-shape shape3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">创建新账号</h1>
          <p className="login-subtitle">填写以下信息完成注册</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* 用户名输入框 */}
          <div className={`form-group ${focusedField === 'username' ? 'focused' : ''} ${errors.username ? 'error' : ''}`}>
            <label htmlFor="username" className="form-label">
              用户名 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <UserOutlined />
              </span>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                placeholder="请输入用户名（3-20个字符）"
                value={formData.username}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          {/* 邮箱输入框 */}
          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${errors.email ? 'error' : ''}`}>
            <label htmlFor="email" className="form-label">
              邮箱 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <MailOutlined />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* 手机号输入框（可选） */}
          <div className={`form-group ${focusedField === 'phone' ? 'focused' : ''} ${errors.phone ? 'error' : ''}`}>
            <label htmlFor="phone" className="form-label">
              手机号（可选）
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <PhoneOutlined />
              </span>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                placeholder="请输入手机号码"
                value={formData.phone}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          {/* 密码输入框 */}
          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${errors.password ? 'error' : ''}`}>
            <label htmlFor="password" className="form-label">
              密码 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockOutlined />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input"
                placeholder="请输入密码（6-20位，含字母和数字）"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                disabled={loading}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* 确认密码输入框 */}
          <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''} ${errors.confirmPassword ? 'error' : ''}`}>
            <label htmlFor="confirmPassword" className="form-label">
              确认密码 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockOutlined />
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                注册中...
              </>
            ) : (
              '立即注册'
            )}
          </button>

          {/* 返回登录链接 */}
          <div className="register-section">
            <span className="register-text">已有账号？</span>
            <button
              type="button"
              className="link-button register-link"
              onClick={onBackToLogin}
              disabled={loading}
            >
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
