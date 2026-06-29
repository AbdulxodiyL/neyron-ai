const openai = require('../../config/openai');
const { getGradingPrompt, getResultAnalysisPrompt } = require('./prompts');

const gradeHomework = async (homeworkTitle, description, studentAnswer, maxScore = 100) => {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert Biology and Chemistry teacher. Grade student work fairly and constructively. Always respond in valid JSON.' },
        { role: 'user', content: getGradingPrompt(homeworkTitle, description, studentAnswer, maxScore) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error('Grading error:', err.message);
    return { score: 0, feedback: 'AI grading unavailable. Teacher will review manually.', suggestions: [] };
  }
};

const analyzeTestResults = async (testTitle, wrongQuestions, correctTopics, language = 'uz') => {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert educational analyst. Always respond in valid JSON.' },
        { role: 'user', content: getResultAnalysisPrompt(testTitle, wrongQuestions, correctTopics, language) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 600,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (err) {
    console.error('Analysis error:', err.message);
    return { weakTopics: [], strongTopics: correctTopics, studyRecommendations: ['Review all topics carefully'] };
  }
};

module.exports = { gradeHomework, analyzeTestResults };
