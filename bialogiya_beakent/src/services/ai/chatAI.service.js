const openai = require('../../config/openai');
const { getChatSystemPrompt } = require('./prompts');

// lesson object passed directly from controller (avoids double DB call)
const chatWithAI = async (lesson, messages, userMessage, style = 'normal', language = 'uz') => {
  const aiContent = lesson.aiContent || {};
  const systemPrompt = getChatSystemPrompt(lesson.title, aiContent.summary || '', style, language);

  const history = (messages || []).slice(-10).map(m => ({ role: m.role, content: m.content }));

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...history],
    temperature: 0.8,
    max_tokens: 800,
  });

  return response.choices[0].message.content;
};

module.exports = { chatWithAI };
