import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2, Clapperboard, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function ExplainerVideoPlayer({ lessonId }) {
  const queryClient = useQueryClient();
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  const { data: script, isLoading } = useQuery({
    queryKey: ['explainer-video', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/ai/explainer-video`).then(r => r.data.data),
  });

  const generate = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/ai/explainer-video`, {}),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(['explainer-video', lessonId], data.data);
      setSlideIdx(0);
    },
    onError: () => toast.error("Video skripti yaratib bo'lmadi. Qayta urinib ko'ring."),
  });

  const slides = script?.slides || [];
  const slide = slides[slideIdx];

  useEffect(() => {
    // stop playback + release the previous slide's audio whenever the slide changes
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
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
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

  // auto-play narration right after moving to a new slide, if we were mid-playback
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
    setSlideIdx(i);
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
      <div className="relative aspect-video rounded-2xl gradient-bg overflow-hidden shadow-glow mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIdx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 flex flex-col justify-center p-8 text-white"
          >
            <div className="text-xs uppercase tracking-widest opacity-70 mb-2">
              {slideIdx + 1} / {slides.length}
            </div>
            <h3 className="text-2xl font-bold mb-4">{slide?.title}</h3>
            <ul className="space-y-2">
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
          </motion.div>
        </AnimatePresence>

        {playing && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1">
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} animate={{ scaleY: [1, 2.2, 1] }} transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                className="w-1 h-3 bg-white/80 rounded-full" />
            ))}
          </div>
        )}
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
