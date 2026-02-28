import OpenAI from 'openai';

// 使用你的 DeepSeek API Key
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: 'sk-0e602c9c9f6e4bb0bf0e69814617d41c'
});

async function testDeepSeek() {
  console.log('🤖 测试 DeepSeek API...\n');

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: '你是一位资深的人力资源专家。'
        },
        {
          role: 'user',
          content: '请简要分析一下"5年 Node.js 开发经验，熟悉 React、Vue 框架"这样的候选人适合什么样的岗位？'
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('✅ DeepSeek API 调用成功！\n');
    console.log('📝 AI 回复：');
    console.log(response.choices[0].message.content);
    console.log('\n📊 使用统计：');
    console.log(`- 输入 tokens: ${response.usage.prompt_tokens}`);
    console.log(`- 输出 tokens: ${response.usage.completion_tokens}`);
    console.log(`- 总计 tokens: ${response.usage.total_tokens}`);

  } catch (error) {
    console.error('❌ DeepSeek API 调用失败：', error.message);
  }
}

testDeepSeek();
