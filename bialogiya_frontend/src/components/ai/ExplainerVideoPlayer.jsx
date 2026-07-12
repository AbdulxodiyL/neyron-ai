import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2, Clapperboard, ChevronLeft, ChevronRight, RotateCcw, Volume2, VolumeX, ImageOff } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const formatTime = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

export default function ExplainerVideoPlayer({ lessonId }) {
  const queryClient = useQueryClient();
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const imageCacheRef = useRef(new Map()); // slideIndex -> object URL

  const [slideIdx, setSlideIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageStatus, setImageStatus] = useState('idle'); // idle | loading | ready | error

  const { data: script, isLoading } = useQuery({
    queryKey: ['explainer-video', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/ai/explainer-video`).then(r => r.data.data),
  });

  const generate = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/ai/explainer-video`, {}),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(['explainer-video', lessonId], data.data);
      imageCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      imageCacheRef.current.clear();
      setSlideIdx(0);
    },
    onError: () => toast.error("Video skripti yaratib bo'lmadi. Qayta urinib ko'ring."),
  });

  const slides = script?.slides || [];
  const slide = slides[slideIdx];

  // --- Image loading (cached per slide index for the session) ---
  const loadImage = useCallback(async (idx) => {
    if (imageCacheRef.current.has(idx)) {
      setImageUrl(imageCacheRef.current.get(idx));
      setImageStatus('ready');
      return;
    }
    setImageStatus('loading');
    setImageUrl(null);
    try {
      const res = await api.get(`/lessons/${lessonId}/ai/explainer-video/image/${idx}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      imageCacheRef.current.set(idx, url);
      setImageUrl(url);
      setImageStatus('ready');
    } catch (err) {
      console.error(err);
      setImageStatus('error');
    }
  }, [lessonId]);

  useEffect(() => {
    return () => {
      imageCacheRef.current.forEach(url => URL.revokeObjectURL(url));
      imageCacheRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (slide) loadImage(slideIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx, slides.length]);

  // --- Audio playback ---
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [slideIdx]);

  const playSlide = async () => {
    if (!slide) return;
    setAudioLoading(true);
    try {
      const res = await api.get(`/lessons/${lessonId}/ai/explainer-video/audio/${slideIdx}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      objectUrlRef.current = url;
      const audio = new Audio(url);
      audio.muted = muted;
      audioRef.current = audio;
      audio.addEventListener('timeupdate', () => setProgress(audio.currentTime));
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        if (slideIdx < slides.length - 1) setSlideIdx(i => i + 1);
      };
      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error(err);
      toast.error("Ovozni yuklab bo'lmadi");
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    if (playing) playSlide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideIdx]);

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const goTo = (i) => {
    audioRef.current?.pause();
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    setSlideIdx(i);
  };

  const seek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setProgress(pct * duration);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  if (!script) {
    return (
      <div className="text-center py-10">
        <Clapperboard size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm mb-4">Bu mavzu uchun hali tushuntiruvchi video yaratilmagan.</p>
        <button onClick={() => generate.mutate()} disabled={generate.isPending} className="btn-primary flex items-center gap-2 mx-auto">
          {generate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />}
          Video yaratish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* "Screen" */}
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-glow mb-4 bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0"
          >
            {imageStatus === 'ready' && imageUrl ? (
              <img src={imageUrl} alt={slide?.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : imageStatus === 'error' ? (
              <div className="absolute inset-0 gradient-bg flex items-center justify-center">
                <ImageOff size={32} className="text-white/50" />
              </div>
            ) : (
              <div className="absolute inset-0 gradient-bg animate-pulse" />
            )}
            {/* Readability overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 text-white">
              <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
                {slideIdx + 1} / {slides.length}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{slide?.title}</h3>
              <ul className="space-y-1.5">
                {slide?.bullets?.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.12 }}
                    className="flex items-start gap-2 text-sm sm:text-base"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0" />
                    {b}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>

        {playing && (
          <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2.2, 1] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                className="w-1 h-3 bg-white/80 rounded-full" />
            ))}
          </div>
        )}
      </div>

      {/* Audio scrubber */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-gray-400 w-9 text-right">{formatTime(progress)}</span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer" onClick={seek}>
          <div className="h-full gradient-bg rounded-full" style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }} />
        </div>
        <span className="text-[11px] text-gray-400 w-9">{duration ? formatTime(duration) : '--:--'}</span>
        <button onClick={toggleMute} className="btn-ghost p-1.5 rounded-lg flex-shrink-0">
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={() => goTo(Math.max(0, slideIdx - 1))} disabled={slideIdx === 0} className="btn-ghost p-2 rounded-xl disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={playing ? pause : playSlide}
          disabled={audioLoading}
          className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white shadow-glow disabled:opacity-60"
        >
          {audioLoading ? <Loader2 size={18} className="animate-spin" /> : playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button onClick={() => goTo(Math.min(slides.length - 1, slideIdx + 1))} disabled={slideIdx === slides.length - 1} className="btn-ghost p-2 rounded-xl disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slide dots */}
      <div className="flex justify-center gap-1.5 mb-4">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'w-6 bg-primary' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>

      <div className="text-center">
        <button onClick={() => generate.mutate()} disabled={generate.isPending}
          className="btn-ghost text-xs text-gray-400 flex items-center gap-1.5 mx-auto">
          {generate.isPending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          Videoni qayta yaratish
        </button>
      </div>
    </div>
  );
}
