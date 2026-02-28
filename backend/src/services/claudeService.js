const DEFAULT_MODELS_URL = process.env.CLAUDE_API_BASE || 'https://api.anthropic.com/v1/models';

const claudeService = {
  async validateApiKey(apiKey) {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch(DEFAULT_MODELS_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`
          }
        });
        return res.ok;
      }

      // 如果环境没有全局 fetch，则使用 https 请求作为回退
      const https = await import('https');
      return new Promise((resolve) => {
        const url = new URL(DEFAULT_MODELS_URL);
        const options = {
          hostname: url.hostname,
          path: url.pathname + (url.search || ''),
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${apiKey}`
          }
        };

        const req = https.request(options, (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 300);
        });

        req.on('error', (e) => {
          console.error('claudeService https request error', e);
          resolve(false);
        });

        req.end();
      });
    } catch (err) {
      console.error('claudeService.validateApiKey error', err);
      return false;
    }
  }
  ,
  async sendChat(messages, apiKey, opts = {}) {
    try {
      const model = opts.model || process.env.CLAUDE_MODEL || 'claude-2';
      // 构建简单 prompt：将 messages 数组合并为一个可读的文本
      const prompt = messages.map(m => (m.role ? `${m.role.toUpperCase()}: ${m.content}` : m)).join('\n');
      const url = process.env.CLAUDE_API_CHAT_ENDPOINT || 'https://api.anthropic.com/v1/complete';

      const body = {
        model,
        prompt,
        max_tokens: opts.max_tokens || 512,
        temperature: opts.temperature ?? 0.2
      };

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}`
      };

      let res;
      if (typeof fetch !== 'undefined') {
        res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          console.error('claude sendChat non-ok', res.status, await res.text());
          return null;
        }
        const json = await res.json();
        // 兼容不同返回格式，优先查找 completion/text 或 output
        return json.completion || json.output || (json.choices && json.choices[0] && (json.choices[0].text || json.choices[0].content)) || JSON.stringify(json);
      }

      // https fallback
      const https = await import('https');
      return await new Promise((resolve) => {
        const u = new URL(url);
        const options = {
          hostname: u.hostname,
          path: u.pathname + (u.search || ''),
          method: 'POST',
          headers
        };

        const req = https.request(options, (resp) => {
          let data = '';
          resp.on('data', (chunk) => data += chunk);
          resp.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.completion || json.output || (json.choices && json.choices[0] && (json.choices[0].text || json.choices[0].content)) || JSON.stringify(json));
            } catch (e) {
              resolve(data);
            }
          });
        });

        req.on('error', (e) => {
          console.error('claudeService.sendChat https error', e);
          resolve(null);
        });

        req.write(JSON.stringify(body));
        req.end();
      });
    } catch (err) {
      console.error('claudeService.sendChat error', err);
      return null;
    }
  }
};

export default claudeService;
