const { getModel } = require('../../config/gemini');
const { prisma } = require('../../config/db');
const { LESSON_SYSTEM_PROMPT, getLessonGenerationPrompt } = require('./prompts');

const generateLessonAI = async (lessonId, title, content, language = 'uz') => {
  await prisma.lesson.update({ where: { id: lessonId }, data: { aiContent: { status: 'generating' } } });

  try {
    const model = getModel(true);
    const prompt = `${LESSON_SYSTEM_PROMPT}\n\n${getLessonGenerationPrompt(title, content || title, language)}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

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
  const prompt = `Generate 10 multiple-choice quiz questions about "${title}" based on: "${content.slice(0, 1000)}".
Difficulty: ${difficulty}.
Return valid JSON: {"questions":[{"text":"...","options":[{"text":"...","isCorrect":false},{"text":"...","isCorrect":true}],"explanation":"...","difficulty":"${difficulty}","points":1}]}
Each question must have exactly 4 options with exactly one isCorrect:true.`;

  try {
    const model = getModel(true);
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed.questions || [];
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    return [];
  }
};

const generateTestFromPDFText = async (pdfText, groupId, teacherId, title, language = 'uz') => {
  const langNote = language === 'uz' ? "Iltimos, barcha savollarni O'zbek (uz) tilida yarating." : `Please generate the questions in ${language}.`;
  const prompt = `You are a Biology/Chemistry teacher. Based on the following textbook content, create 15 multiple-choice test questions.
Language: ${language}.
${langNote}
Content:
${pdfText.slice(0, 3000)}

Return valid JSON:
{
  "title": "${title}",
  "summary": "A short student-facing summary of the PDF content (in the requested language)",
  "questions": [
    {
      "text": "question text",
      "options": [
        {"text": "option A", "isCorrect": false},
        {"text": "option B", "isCorrect": true},
        {"text": "option C", "isCorrect": false},
        {"text": "option D", "isCorrect": false}
      ],
      "explanation": "a concise reason the correct answer is right",
      "studentExplanation": "a step-by-step, beginner-friendly explanation for the student in the requested language",
      "difficulty": "medium",
      "points": 1
    }
  ]
}
Each question must have exactly 4 options with exactly one isCorrect:true. Provide studentExplanation for every question in the requested language.`;

  const model = getModel(true);
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  return parsed;
};

module.exports = { generateLessonAI, generateQuiz, generateTestFromPDFText };
