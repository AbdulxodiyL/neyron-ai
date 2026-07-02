const { getModel } = require('../../config/gemini');
const { getChatSystemPrompt } = require('./prompts');

const chatWithAI = async (lesson, messages, userMessage, style = 'normal', language = 'uz') => {
  const aiContent = lesson.aiContent || {};
  const systemPrompt = getChatSystemPrompt(lesson.title, aiContent.summary || '', style, language);

  const history = (messages || []).slice(-10);
  const historyText = history.map(m => `${m.role === 'user' ? 'Student' : 'Teacher AI'}: ${m.content}`).join('\n');

  const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nStudent: ${userMessage}\nTeacher AI:`;

  const model = getModel(false);
  const result = await model.generateContent(fullPrompt);
  return result.response.text().trim();
};

module.exports = { chatWithAI };
