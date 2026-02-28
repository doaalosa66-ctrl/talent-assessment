import claudeService from '../services/claudeService.js';
import fs from 'fs';
import path from 'path';

export async function handleClaudeChat(req, res) {
  const { messages, apiKey: providedKey } = req.body || {};

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: 'messages 必须为字符串数组' });
  }

  try {
    let apiKey = providedKey;
    if (!apiKey) {
      const accountsPath = path.resolve('backend', 'claude_accounts.json');
      if (fs.existsSync(accountsPath)) {
        const raw = fs.readFileSync(accountsPath, 'utf8') || '[]';
        const arr = JSON.parse(raw);
        if (arr.length > 0) apiKey = arr[0].apiKey;
      }
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, error: '未提供 apiKey，且未发现已保存的账户' });
    }

    const reply = await claudeService.sendChat(messages, apiKey);
    if (!reply) {
      return res.status(500).json({ success: false, error: '调用 Claude 失败' });
    }

    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('handleClaudeChat error', err);
    res.status(500).json({ success: false, error: err.message || '处理失败' });
  }
}
