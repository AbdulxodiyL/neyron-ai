import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Loader2, Volume2, RotateCcw } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const formatTime = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function StoryAudioPlayer({ lessonId }) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | playing | error
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const loadAndPlay = async () => {
    if (audioRef.current && objectUrlRef.current) {
      audioRef.current.play();
      setStatus('playing');
      return;
    }
    setStatus('loading');
    try {
      const res = await api.get(`/lessons/${lessonId}/ai/story-audio`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener('timeupdate', () => setProgress(audio.currentTime));
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('ended', () => setStatus('ready'));
      await audio.play();
      setStatus('playing');
    } catch (err) {
      console.error(err);
      toast.error("Audio yaratib bo'lmadi. Birozdan so'ng qayta urinib ko'ring.");
      setStatus('error');
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setStatus('ready');
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setStatus('playing');
    }
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const isBusy = status === 'loading';
  const isPlaying = status === 'playing';

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
      <button
        onClick={isPlaying ? pause : loadAndPlay}
        disabled={isBusy}
        className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white shadow-glow flex-shrink-0 disabled:opacity-60"
      >
        {isBusy ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
          <Volume2 size={13} />
          <span>Hikoyani AI ovoz bilan tinglash</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer" onClick={seek}>
          <motion.div
            className="h-full gradient-bg rounded-full"
            style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{duration ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>

      {(status === 'ready' || isPlaying) && (
        <button onClick={restart} className="btn-ghost p-2 rounded-xl flex-shrink-0" title="Boshidan">
          <RotateCcw size={16} />
        </button>
      )}
    </div>
  );
}
