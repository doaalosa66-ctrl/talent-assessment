import React, { useState } from 'react';
import { EyeOutlined, EyeInvisibleOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { message } from 'antd';
import './Login.css';

const Login = ({ onLoginSuccess, onRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    username: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // 实时验证函数
  const validateField = (name, value) => {
    let error = '';

    if (name === 'username') {
      if (!value.trim()) {
        error = '用户名/邮箱不能为空';
      } else if (value.includes('@')) {
        // 简单的邮箱验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = '请输入有效的邮箱地址';
        }
      }
    }

    if (name === 'password') {
      if (!value) {
        error = '密码不能为空';
      } else if (value.length < 6) {
        error = '密码至少需要6位字符';
      }
    }

    return error;
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // 实时验证（仅对文本输入）
    if (type !== 'checkbox') {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  // 表单提交前验证
  const validateForm = () => {
    const usernameError = validateField('username', formData.username);
    const passwordError = validateField('password', formData.password);

    setErrors({
      username: usernameError,
      password: passwordError
    });

    return !usernameError && !passwordError;
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        message.error(data.error || '登录失败，请检查用户名和密码');
        return;
      }

      message.success('登录成功！');

      if (formData.rememberMe) {
        localStorage.setItem('rememberedUser', formData.username);
      } else {
        localStorage.removeItem('rememberedUser');
      }

      if (onLoginSuccess) {
        onLoginSuccess({
          username: data.data.user.username,
          token: data.data.token,
          ...data.data.user
        });
      }

    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 处理忘记密码
  const handleForgotPassword = () => {
    message.info('忘记密码功能开发中...');
  };

  // 处理注册
  const handleRegister = () => {
    if (onRegister) {
      onRegister();
    }
  };

  // 组件加载时检查是否有记住的用户名
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUser,
        rememberMe: true
      }));
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="background-shape shape1"></div>
        <div className="background-shape shape2"></div>
        <div className="background-shape shape3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">欢迎回来</h1>
          <p className="login-subtitle">登录您的账号以继续使用</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* 用户名/邮箱输入框 */}
          <div className={`form-group ${focusedField === 'username' ? 'focused' : ''} ${errors.username ? 'error' : ''}`}>
            <label htmlFor="username" className="form-label">
              用户名/邮箱
            </label>
            <div className="input-wrapper">
              <span className="input-icon">
                {formData.username.includes('@') ? <MailOutlined /> : <UserOutlined />}
              </span>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                placeholder="请输入用户名或邮箱"
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

          {/* 密码输入框 */}
          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${errors.password ? 'error' : ''}`}>
            <label htmlFor="password" className="form-label">
              密码
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
                placeholder="请输入密码（至少6位）"
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

          {/* 记住我和忘记密码 */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkbox-text">记住我</span>
            </label>
            <button
              type="button"
              className="link-button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              忘记密码？
            </button>
          </div>

          {/* 登录按钮 */}
          <button
            type="submit"
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                登录中...
              </>
            ) : (
              '登录'
            )}
          </button>

          {/* 注册链接 */}
          <div className="register-section">
            <span className="register-text">还没有账号？</span>
            <button
              type="button"
              className="link-button register-link"
              onClick={handleRegister}
              disabled={loading}
            >
              立即注册
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default Login;
