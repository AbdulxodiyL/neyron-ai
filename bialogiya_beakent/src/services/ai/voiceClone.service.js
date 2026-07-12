const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

const requireKey = () => {
  if (!process.env.ELEVENLABS_API_KEY) {
    const err = new Error('ELEVENLABS_API_KEY is not configured on the server');
    err.status = 500;
    throw err;
  }
};

/**
 * Create an instant voice clone from an uploaded audio sample.
 * fileBuffer: Buffer of the sample audio (mp3/wav/m4a...), 30s-3min of clean
 * speech works best. Returns the new voice_id.
 */
const cloneVoice = async (name, fileBuffer, mimeType, filename) => {
  requireKey();

  const form = new FormData();
  form.append('name', name);
  form.append('files', new Blob([fileBuffer], { type: mimeType }), filename || 'sample.mp3');

  const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('ElevenLabs clone error:', detail);
    const err = new Error('Voice cloning failed');
    err.status = 502;
    throw err;
  }

  const data = await res.json();
  return data.voice_id;
};

const deleteVoice = async (voiceId) => {
  requireKey();
  await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
  }).catch(() => {}); // best-effort cleanup
};

/**
 * Synthesize speech with a cloned (or any ElevenLabs) voice_id. Returns a
 * Buffer of MP3 audio - same shape as tts.service.js's synthesizeSpeech so
 * callers can use either interchangeably.
 */
const synthesizeWithClonedVoice = async (text, voiceId) => {
  requireKey();
  const input = (text || '').trim().slice(0, 4500);
  if (!input) throw new Error('No text to synthesize');

  const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: input,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('ElevenLabs TTS error:', detail);
    throw new Error('Cloned-voice synthesis failed');
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = { cloneVoice, deleteVoice, synthesizeWithClonedVoice };
