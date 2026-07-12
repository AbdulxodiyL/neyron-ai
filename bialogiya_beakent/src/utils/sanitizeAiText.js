// Gemini is instructed not to use markdown in plain-text fields (see prompts.js),
// but LLMs occasionally slip anyway. This strips the common markers so raw
// "**word**" never reaches the UI, without needing a markdown renderer.
const stripMarkdown = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/__(.*?)__/g, '$1')     // __bold__
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1') // *italic*
    .replace(/^#{1,6}\s+/gm, '')     // # headers
    .replace(/^[-*]\s+/gm, '')       // - bullets / * bullets
    .trim();
};

// Recursively applies stripMarkdown to every string in an object/array,
// leaving numbers, booleans, and structure untouched.
const sanitizeAiContent = (value) => {
  if (typeof value === 'string') return stripMarkdown(value);
  if (Array.isArray(value)) return value.map(sanitizeAiContent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeAiContent(v)]));
  }
  return value;
};

module.exports = { stripMarkdown, sanitizeAiContent };
