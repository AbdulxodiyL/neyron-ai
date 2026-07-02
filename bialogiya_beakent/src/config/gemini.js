const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GIMINI_AI_API_KEY || '');

const getModel = (jsonMode = false) => {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

module.exports = { genAI, getModel };
