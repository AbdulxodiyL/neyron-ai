# Yangi AI funksiyalari — sozlash bo'yicha qo'llanma

Bu yangilanish uchta yangi funksiya qo'shdi: (1) hikoyani AI ovoz bilan o'qib berish,
(2) tushuncha/grammatika uchun slayd+ovoz+animatsiyali "video", (3) real vaqtda
ovozli speaking practice (qattiq, lekin hurmatli xato tuzatish bilan). Ixtiyoriy
qo'shimcha: (4) o'z ovozingizni yuklab, o'sha ovozda narratsiya qilish.

**Barcha uchta asosiy funksiya endi to'liq Gemini AI (bepul tarif) orqali
ishlaydi — OpenAI hisobi/to'lov SHART EMAS.** Loyiha allaqachon ishlatayotgan
`GIMINI_AI_API_KEY`ning o'zi TTS narratsiya va real-time speaking uchun ham
yetarli.

## 1. Kerakli environment o'zgaruvchilar (backend `.env`)

```
GIMINI_AI_API_KEY=...                              # allaqachon bor bo'lishi kerak
GEMINI_TTS_MODEL=gemini-2.5-flash-preview-tts        # ixtiyoriy, shu default
GEMINI_TTS_VOICE=Kore                                # ixtiyoriy — boshqa ovozlar: Puck, Leda, Charon va h.k.
GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-preview-09-2025  # ixtiyoriy
```

`OPENAI_API_KEY` endi **umuman shart emas** — bo'sh qoldirsangiz ham server
ishlayveradi. (Eslatma: avval bu kalit bo'lmasa server hatto ishga tushmay
yiqilar edi — bu asl loyihadagi xato edi, endi tuzatilgan, chunki Gemini'ga
o'tishda OpenAI kodiga bog'liqlik butunlay olib tashlandi.)

**Muhim**: `GEMINI_LIVE_MODEL` — bu "preview" (eksperimental) model nomi va
vaqti-vaqti bilan Google tomonidan yangilanadi/o'zgartiriladi. Agar speaking
funksiyasi "model topilmadi" xatosi bersa, joriy nomni
https://ai.google.dev/gemini-api/docs/models dan tekshirib, shu env
o'zgaruvchida yangilang.

## 2. Yangi npm paket

```bash
npm install   # package.json'ga @google/genai qo'shildi (Gemini Live uchun)
```

## 3. Ma'lumotlar bazasi

`prisma/schema.prisma`ga `LessonMedia` jadvali va `User`ga
`clonedVoiceId`/`clonedVoiceName` maydonlari qo'shildi:

```bash
npx prisma generate
```

Jadval/ustunlar serverga birinchi marta ishga tushganda `src/config/db.js`dagi
`runMigrations()` orqali avtomatik yaratiladi.

## 4. Yangi backend endpointlar

| Method | Endpoint | Nima qiladi |
|---|---|---|
| GET | `/api/lessons/:id/ai/story-audio` | Hikoyani Gemini TTS bilan audio qilib qaytaradi (keshlangan) |
| POST | `/api/lessons/:id/ai/explainer-video` | Slayd skriptini (Gemini) generatsiya qiladi |
| GET | `/api/lessons/:id/ai/explainer-video` | Saqlangan slayd skriptini qaytaradi |
| GET | `/api/lessons/:id/ai/explainer-video/audio/:slideIndex` | Har bir slayd uchun narratsiya audiosi (lazy, keshlangan) |
| POST | `/api/speaking/session` | Gemini Live uchun bir martalik token yaratadi — brauzer shu token bilan to'g'ridan-to'g'ri Google'ga WebSocket ulanadi |
| POST | `/api/voice/clone` | (ixtiyoriy) ElevenLabs orqali ovoz namunasidan klon yaratadi |
| GET/DELETE | `/api/voice/profile` | Klonlangan ovoz holatini ko'rish/o'chirish |

Barcha `/ai/`, `/speaking/*` va `/voice/*` yo'llari uchun qo'shimcha rate-limit
bor (`server.js`dagi `aiLimiter`, 15 daqiqada 60 so'rov/IP).

## 5. Frontend

`LessonDetail.jsx`ga **Video** va **Speaking** tablari, **Story** tabiga esa
audio pleyer qo'shildi. Yangi komponentlar:

- `src/components/ai/StoryAudioPlayer.jsx`
- `src/components/ai/ExplainerVideoPlayer.jsx`
- `src/components/ai/SpeakingPractice.jsx` — Gemini Live bilan WebSocket +
  xom PCM audio orqali ishlaydi (OpenAI'ning WebRTC yondashuvidan farqli,
  chunki Gemini xom audio oqimini talab qiladi — kod ichida izohlangan)
- `src/pages/teacher/TeacherVoice.jsx` — o'qituvchi uchun ovoz yuklash sahifasi (`/teacher/voice`)

Boshqa hech narsa o'zgartirilmadi.

## 6. Ovoz klonlash (hali ham ixtiyoriy, ElevenLabs orqali)

Gemini'da hozircha ochiq voice-cloning API yo'q, shuning uchun bu qism hamon
**ElevenLabs**ga bog'liq (alohida, pullik hisob — Starter tarif, ~$5-6/oy).
Agar bu funksiyani ishlatmoqchi bo'lmasangiz, shunchaki `ELEVENLABS_API_KEY`ni
bo'sh qoldiring — hikoya/video narratsiyasi avtomatik standart Gemini ovozida
(`Kore`) ishlayveradi.

```
ELEVENLABS_API_KEY=
ELEVENLABS_MODEL=eleven_multilingual_v2
```

## 7. Bilishga arzigulik narsalar

- **Xarajat**: har bir story-audio va slayd-audio faqat **bir marta**
  generatsiya qilinadi va bazada keshlanadi (`LessonMedia`) — keyingi
  tinglashlar tekin. Gemini Flash-family TTS/Live bepul tarifda, faqat rate-limit
  bilan cheklangan (kredit karta shart emas).
- **Speaking coach ohangi**: `services/ai/prompts.js`dagi
  `getSpeakingCoachInstructions` shu funksiyani boshqaradi — kerak bo'lsa shu
  yerda o'zgartiring.
- **Xavfsizlik**: `/api/speaking/session` Gemini ephemeral tokenini
  `liveConnectConstraints` bilan qulflab beradi (model + system instruction
  server tomonda mahkamlangan) — bu qadam ataylab qo'yilgan, chunki bu
  cheklovsiz qoldirilsa, klient tokendan foydalanib tizim ko'rsatmalarini
  almashtirib yuborishi mumkin bo'lgan haqiqiy zaiflik hisoblanadi.
- `services/ai/tts.service.js` va OpenAI Realtime kodi repo'da qoldi, lekin
  hech qayerdan chaqirilmaydi — kelajakda kerak bo'lsa, muqobil variant
  sifatida saqlab qo'yildi.
