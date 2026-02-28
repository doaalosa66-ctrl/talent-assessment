import React, { useState } from 'react';
import './ClaudeChat.css';
import { message } from 'antd';

const ClaudeChat = ({ visible, onClose }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const reply = { role: 'assistant', content: json.data.reply };
        setHistory(prev => [...prev, reply]);
      } else {
        message.error('调用 Claude 失败：' + (json.error || '未知错误'));
      }
    } catch (err) {
      console.error('Claude chat error', err);
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="claude-chat-overlay">
      <div className="claude-chat-window">
        <div className="claude-chat-header">
          <strong>Claude Code 对话</strong>
          <button onClick={onClose} className="close-btn">关闭</button>
        </div>
        <div className="claude-chat-body">
          {history.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="role">{m.role}</div>
              <pre className="content">{m.content}</pre>
            </div>
          ))}
        </div>
        <div className="claude-chat-footer">
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="输入代码或提问，例如：修复这段 React 组件的错误" />
          <div className="actions">
            <button onClick={() => { setHistory([]); setInput(''); }} className="clear">清空</button>
            <button onClick={send} disabled={loading} className="send">{loading ? '发送中...' : '发送'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeChat;
