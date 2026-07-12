const { getModel } = require('../../config/gemini');
const { getExplainerVideoPrompt } = require('./prompts');
const { sanitizeAiContent } = require('../../utils/sanitizeAiText');

const generateExplainerScript = async (title, content, language = 'uz') => {
  const model = getModel(true);
  const prompt = getExplainerVideoPrompt(title, content, language);
  const result = await model.generateContent(prompt);
  const parsed = sanitizeAiContent(JSON.parse(result.response.text()));

  const slides = Array.isArray(parsed.slides) ? parsed.slides.slice(0, 8) : [];
  if (slides.length === 0) throw new Error('AI did not return any slides');

  return {
    topic: parsed.topic || title,
    language,
    slides: slides.map((s, i) => ({
      index: i,
      title: s.title || `Slide ${i + 1}`,
      bullets: Array.isArray(s.bullets) ? s.bullets.slice(0, 5) : [],
      narration: s.narration || '',
    })),
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { generateExplainerScript };
