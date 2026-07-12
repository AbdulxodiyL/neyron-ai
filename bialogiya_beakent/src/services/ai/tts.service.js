const openai = require('../../config/openai');

// Voices available on OpenAI's TTS models: alloy, ash, ballad, coral, echo,
// fable, onyx, nova, sage, shimmer, verse, marin, cedar.
const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE || 'coral';
const DEFAULT_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

// OpenAI TTS caps input around 4096 characters; lesson stories/narration
// scripts are written short by our prompts, but we still guard against
// overly long text so a single bad generation can't blow past the limit.
const MAX_CHARS = 3800;

/**
 * Synthesize speech for a piece of text. Returns a Buffer of MP3 audio.
 */
const synthesizeSpeech = async (text, { voice = DEFAULT_VOICE, instructions } = {}) => {
  const input = (text || '').trim().slice(0, MAX_CHARS);
  if (!input) throw new Error('No text to synthesize');

  const response = await openai.audio.speech.create({
    model: DEFAULT_MODEL,
    voice,
    input,
    response_format: 'mp3',
    ...(instructions ? { instructions } : {}),
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = { synthesizeSpeech, DEFAULT_VOICE };
