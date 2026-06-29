const openai = require('../../config/openai');
const { prisma } = require('../../config/db');
const { LESSON_SYSTEM_PROMPT, getLessonGenerationPrompt } = require('./prompts');

const generateLessonAI = async (lessonId, title, content, language = 'uz') => {
  await prisma.lesson.update({ where: { id: lessonId }, data: { aiContent: { status: 'generating' } } });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: LESSON_SYSTEM_PROMPT },
        { role: 'user', content: getLessonGenerationPrompt(title, content || title, language) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        aiContent: {
          status: 'done',
          simpleExplanation: parsed.simpleExplanation || '',
          mnemonics: parsed.mnemonics || '',
          storyMode: parsed.storyMode || '',
          realLifeExamples: parsed.realLifeExamples || '',
          summary: parsed.summary || '',
          flashcards: parsed.flashcards || [],
          mindMapData: parsed.mindMapData || { nodes: [], edges: [] },
          quizQuestions: parsed.quizQuestions || [],
          generatedAt: new Date().toISOString(),
        },
      },
    });
    console.log(`✅ AI content generated for: ${title}`);
  } catch (err) {
    console.error('AI generation error:', err.message);
    await prisma.lesson.update({ where: { id: lessonId }, data: { aiContent: { status: 'error', errorMessage: err.message } } });
  }
};

const generateQuiz = async (title, content, difficulty = 'medium') => {
  const prompt = `Generate 10 multiple-choice quiz questions about "${title}" with content: "${content.slice(0, 500)}".
Difficulty: ${difficulty}. Return JSON: {"questions":[{"text":"...","options":[{"text":"...","isCorrect":bool}],"explanation":"...","difficulty":"${difficulty}","points":1}]}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  return parsed.questions || [];
};

module.exports = { generateLessonAI, generateQuiz };
