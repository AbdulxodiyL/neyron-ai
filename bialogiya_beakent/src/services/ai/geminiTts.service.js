// Text-to-speech via the Gemini API (same GIMINI_AI_API_KEY already used for
// lesson generation). Flash-family models are free within rate limits - no
// OpenAI account/billing needed. See:
// https://ai.google.dev/gemini-api/docs/speech-generation

const MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const DEFAULT_VOICE = process.env.GEMINI_TTS_VOICE || 'Kore';
const MAX_CHARS = 4500;

// Gemini TTS returns raw 16-bit PCM (mono, 24kHz) with no container, so we
// wrap it in a minimal WAV header to make it a playable audio/wav file.
const pcmToWav = (pcmBuffer, sampleRate = 24000, channels = 1, bitsPerSample = 16) => {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
};

/**
 * Synthesize speech for a piece of text. Returns a Buffer of WAV audio.
 */
const synthesizeSpeech = async (text, { voice = DEFAULT_VOICE } = {}) => {
  const input = (text || '').trim().slice(0, MAX_CHARS);
  if (!input) throw new Error('No text to synthesize');
  if (!process.env.GIMINI_AI_API_KEY) throw new Error('GIMINI_AI_API_KEY is not configured on the server');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GIMINI_AI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: input }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Gemini TTS error:', detail);
    throw new Error('Gemini TTS synthesis failed');
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!part?.data) throw new Error('Gemini TTS returned no audio data');

  const pcm = Buffer.from(part.data, 'base64');
  return pcmToWav(pcm);
};

module.exports = { synthesizeSpeech, DEFAULT_VOICE, MIME_TYPE: 'audio/wav' };
