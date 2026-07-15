// Friendly Uzbek error messages for AI endpoints - especially Gemini's
// free-tier quota errors (429), which are common and not actual bugs.
export function friendlyAiErrorMessage(err) {
  const status = err?.response?.status;
  const serverMessage = err?.response?.data?.message || '';

  if (status === 429 || /quota|rate.?limit/i.test(serverMessage)) {
    return "AI xizmatining bepul kunlik limiti tugadi. Birozdan so'ng (yoki ertaga) qayta urinib ko'ring.";
  }
  if (status === 401 || status === 403) {
    return 'Ruxsat yo\'q - sahifani yangilab qayta urinib ko\'ring.';
  }
  if (status >= 500) {
    return "AI xizmati hozircha javob bermayapti. Birozdan so'ng qayta urinib ko'ring.";
  }
  // Ordinary 4xx (validation, duplicate, not found) - show the real reason if we have one.
  return serverMessage || "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.";
}
