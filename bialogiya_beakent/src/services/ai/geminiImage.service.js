// Image generation via Gemini's "Nano Banana" model - same free-tier
// GIMINI_AI_API_KEY already used everywhere else in this app.
// https://ai.google.dev/gemini-api/docs/image-generation

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/**
 * Generate an illustration for a prompt. Returns { buffer, mimeType }.
 */
const generateImage = async (prompt) => {
  if (!process.env.GIMINI_AI_API_KEY) throw new Error('GIMINI_AI_API_KEY is not configured on the server');
  const input = (prompt || '').trim().slice(0, 1500);
  if (!input) throw new Error('No prompt to generate an image from');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GIMINI_AI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: input }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Gemini image error:', detail);
    throw new Error(`Gemini image generation failed (HTTP ${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!part) throw new Error('Gemini returned no image data');

  return { buffer: Buffer.from(part.inlineData.data, 'base64'), mimeType: part.inlineData.mimeType || 'image/png' };
};

module.exports = { generateImage };
