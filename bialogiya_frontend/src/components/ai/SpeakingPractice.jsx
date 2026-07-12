import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Loader2, Radio, User, Bot } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const STATUS = { IDLE: 'idle', CONNECTING: 'connecting', CONNECTED: 'connected', ERROR: 'error' };

// Gemini Live streams/receives raw PCM (16-bit, mic @16kHz in, voice @24kHz out) -
// no opus/WebRTC codec negotiation like OpenAI's Realtime API, so we do our
// own capture + playback with the Web Audio API.
const MIC_SAMPLE_RATE = 16000;
const OUT_SAMPLE_RATE = 24000;

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function base64ToInt16(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export default function SpeakingPractice({ lessonId, topic }) {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const wsRef = useRef(null);
  const micCtxRef = useRef(null);
  const micStreamRef = useRef(null);
  const processorRef = useRef(null);
  const playCtxRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const pendingTranscriptRef = useRef({ user: '', assistant: '' });

  useEffect(() => () => cleanup(), []);

  const cleanup = () => {
    processorRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micCtxRef.current?.close().catch(() => {});
    playCtxRef.current?.close().catch(() => {});
    wsRef.current?.close();
    processorRef.current = null;
    micStreamRef.current = null;
    micCtxRef.current = null;
    playCtxRef.current = null;
    wsRef.current = null;
    nextPlayTimeRef.current = 0;
  };

  const playChunk = (base64Pcm) => {
    if (!playCtxRef.current) {
      playCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUT_SAMPLE_RATE });
      nextPlayTimeRef.current = playCtxRef.current.currentTime;
    }
    const ctx = playCtxRef.current;
    const int16 = base64ToInt16(base64Pcm);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000;

    const buffer = ctx.createBuffer(1, float32.length, OUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(nextPlayTimeRef.current, ctx.currentTime);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + buffer.duration;
  };

  const flushTranscript = (role) => {
    const text = pendingTranscriptRef.current[role].trim();
    if (!text) return;
    setTranscript(prev => [...prev, { role, text }]);
    pendingTranscriptRef.current[role] = '';
  };

  const handleServerMessage = (msg) => {
    const content = msg.serverContent;
    if (!content) return;

    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData?.data) {
          setAiSpeaking(true);
          playChunk(part.inlineData.data);
        }
      }
    }
    if (content.inputTranscription?.text) {
      pendingTranscriptRef.current.user += content.inputTranscription.text;
    }
    if (content.outputTranscription?.text) {
      pendingTranscriptRef.current.assistant += content.outputTranscription.text;
    }
    if (content.turnComplete) {
      flushTranscript('user');
      flushTranscript('assistant');
      setAiSpeaking(false);
    }
    if (content.interrupted) {
      setAiSpeaking(false);
      nextPlayTimeRef.current = playCtxRef.current?.currentTime || 0;
    }
  };

  const start = async () => {
    setStatus(STATUS.CONNECTING);
    setTranscript([]);
    try {
      const { data } = await api.post('/speaking/session', { lessonId, topic });
      const { token, model } = data.data;
      if (!token) throw new Error('No token returned');

      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${token}`
      );
      wsRef.current = ws;

      const startMicCapture = async () => {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: MIC_SAMPLE_RATE } });
        micStreamRef.current = micStream;
        const micCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: MIC_SAMPLE_RATE });
        micCtxRef.current = micCtx;
        const source = micCtx.createMediaStreamSource(micStream);
        const processor = micCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(input);
          ws.send(JSON.stringify({
            realtimeInput: { audio: { data: int16ToBase64(pcm16), mimeType: `audio/pcm;rate=${MIC_SAMPLE_RATE}` } },
          }));
        };
        source.connect(processor);
        processor.connect(micCtx.destination);

        setStatus(STATUS.CONNECTED);
      };

      ws.onopen = () => {
        // inputAudioTranscription/outputAudioTranscription must live INSIDE
        // generationConfig (not as siblings of it) - Gemini silently ignores
        // a malformed setup otherwise.
        ws.send(JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          },
        }));
        // Mic capture starts only after the server confirms setupComplete
        // (see ws.onmessage below) - sending audio before that is silently
        // dropped by the server, which is why the AI never responded.
      };

      ws.onmessage = async (evt) => {
        try {
          const text = typeof evt.data === 'string' ? evt.data : await evt.data.text();
          const msg = JSON.parse(text);
          if (msg.setupComplete) {
            startMicCapture().catch(err => {
              console.error(err);
              toast.error("Mikrofonga ruxsat berilmadi");
            });
            return;
          }
          handleServerMessage(msg);
        } catch { /* ignore non-JSON frames */ }
      };

      ws.onerror = () => {
        toast.error("Speaking sessiyasida ulanish xatosi");
      };

      ws.onclose = () => {
        if (status !== STATUS.IDLE) { cleanup(); setStatus(STATUS.IDLE); }
      };
    } catch (err) {
      console.error(err);
      toast.error("Speaking sessiyasini boshlab bo'lmadi");
      cleanup();
      setStatus(STATUS.ERROR);
    }
  };

  const stop = () => {
    cleanup();
    setStatus(STATUS.IDLE);
    setAiSpeaking(false);
  };

  const toggleMute = () => {
    const track = micStreamRef.current?.getAudioTracks()?.[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center">
      <div className="relative w-28 h-28 mb-5">
        <motion.div
          className="absolute inset-0 rounded-full gradient-bg"
          animate={aiSpeaking ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: aiSpeaking ? Infinity : 0 }}
        />
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          {status === STATUS.CONNECTING ? (
            <Loader2 size={30} className="text-white animate-spin" />
          ) : status === STATUS.CONNECTED ? (
            <Radio size={30} className="text-white" />
          ) : (
            <Mic size={30} className="text-white" />
          )}
        </div>
      </div>

      <h3 className="font-bold text-gray-800 dark:text-white mb-1">Speaking Practice</h3>
      <p className="text-sm text-gray-500 text-center mb-1 max-w-sm">
        {topic ? `Mavzu: ${topic}` : 'AI koch bilan real vaqtda gaplashing'}
      </p>
      <p className="text-xs text-gray-400 text-center mb-6 max-w-sm">
        AI xatolaringizni to'g'ridan-to'g'ri, ayamasdan tuzatadi — lekin hurmat bilan.
      </p>

      {status === STATUS.IDLE || status === STATUS.ERROR ? (
        <button onClick={start} className="btn-primary flex items-center gap-2">
          <Mic size={16} /> Suhbatni boshlash
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="btn-ghost p-3 rounded-full" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <MicOff size={18} className="text-red-500" /> : <Mic size={18} />}
          </button>
          <button onClick={stop} className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors">
            <PhoneOff size={18} />
          </button>
        </div>
      )}

      {transcript.length > 0 && (
        <div className="mt-6 w-full space-y-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {transcript.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {t.role === 'assistant' && (
                  <div className="w-6 h-6 gradient-bg rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  t.role === 'user'
                    ? 'gradient-bg text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm'
                }`}>
                  {t.text}
                </div>
                {t.role === 'user' && (
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
