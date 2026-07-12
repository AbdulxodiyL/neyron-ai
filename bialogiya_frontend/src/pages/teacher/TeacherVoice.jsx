import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mic, Upload, Trash2, Loader2, CheckCircle2, Info } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function TeacherVoice() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['voice-profile'],
    queryFn: () => api.get('/voice/profile').then(r => r.data.data),
  });

  const upload = useMutation({
    mutationFn: (file) => {
      const form = new FormData();
      form.append('sample', file);
      return api.post('/voice/clone', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Ovoz muvaffaqiyatli klonlandi');
      queryClient.invalidateQueries(['voice-profile']);
      setFileName('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Ovozni klonlab bo'lmadi"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/voice/profile'),
    onSuccess: () => {
      toast.success("Ovoz o'chirildi");
      queryClient.invalidateQueries(['voice-profile']);
    },
  });

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    upload.mutate(file);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Mening ovozim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ovoz namunangizni yuklang — shundan so'ng darslaringizdagi hikoya audiosi va
          tushuntiruvchi video sizning ovozingizda gapiradi.
        </p>
      </div>

      <div className="card flex items-start gap-3 bg-primary/5 border-primary/20">
        <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
          <p>Toza, aniq ovoz bilan 30 soniya — 2 daqiqa uzunlikdagi audio eng yaxshi natija beradi (fon shovqinisiz).</p>
          <p>Formatlar: MP3, WAV, M4A, WEBM.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
      ) : profile?.hasClonedVoice ? (
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 dark:text-white text-sm">{profile.name || 'Mening ovozim'}</div>
            <div className="text-xs text-gray-500">Faol — yangi darslar shu ovozda gapiradi</div>
          </div>
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="btn-ghost p-2 rounded-xl text-red-500 hover:bg-red-50"
          >
            {remove.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      ) : (
        <div className="card text-center py-8">
          <Mic size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-4">Hali ovoz namunasi yuklanmagan</p>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onPick} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            {upload.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {upload.isPending ? `Yuklanmoqda${fileName ? `: ${fileName}` : '...'}` : 'Audio tanlash'}
          </button>
        </div>
      )}

      {profile?.hasClonedVoice && (
        <div className="text-center">
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onPick} />
          <button onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="btn-ghost text-xs text-gray-400">
            {upload.isPending ? 'Yuklanmoqda...' : 'Yangi namuna bilan almashtirish'}
          </button>
        </div>
      )}
    </div>
  );
}
