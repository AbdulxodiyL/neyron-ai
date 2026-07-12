const { GoogleGenAI } = require('@google/genai');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { getSpeakingCoachInstructions } = require('../services/ai/prompts');

// Gemini Live model names are preview/rotating - override via env if Google
// renames/retires this one. See https://ai.google.dev/gemini-api/docs/models
const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview-09-2025';

// POST /api/speaking/session
// Mints a short-lived Gemini Live "ephemeral token". The real GIMINI_AI_API_KEY
// never leaves the server; the browser only ever sees this one-shot token and
// uses it to open a direct WebSocket connection to Gemini for live speech.
//
// SECURITY: the model + system instruction + response modality are locked
// into the token itself via liveConnectConstraints. Without this, a client
// could reuse the token to open a session with a different system prompt -
// this is a known real-world misconfiguration, not a hypothetical one.
const createSpeakingSession = async (req, res, next) => {
  try {
    if (!process.env.GIMINI_AI_API_KEY) {
      return error(res, 'GIMINI_AI_API_KEY is not configured on the server', 500);
    }

    const { topic, lessonId, level } = req.body || {};

    let resolvedTopic = topic || '';
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
      if (lesson) resolvedTopic = lesson.title;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { language: true } });
    const instructions = getSpeakingCoachInstructions(resolvedTopic, user?.language || 'uz', level || 'intermediate');

    const genAI = new GoogleGenAI({
      apiKey: process.env.GIMINI_AI_API_KEY,
      httpOptions: { apiVersion: 'v1alpha' }, // required for ephemeral tokens
    });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const token = await genAI.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: LIVE_MODEL,
          config: {
            responseModalities: ['AUDIO'],
            systemInstruction: instructions,
          },
        },
      },
    });

    return success(res, {
      token: token.name,
      model: LIVE_MODEL,
      topic: resolvedTopic,
      expireTime,
    });
  } catch (err) {
    console.error('Gemini Live token error:', err.message);
    return error(res, 'Could not start speaking session', 502);
  }
};

module.exports = { createSpeakingSession };
