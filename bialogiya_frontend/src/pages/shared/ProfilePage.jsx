import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Phone, Globe, KeyRound, Save, Flame, Trophy, Users, BookOpen, Building2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getLevelProgress } from '../../utils/format';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const roleLabel = (role) => ({
  student: "O'quvchi", teacher: "O'qituvchi", reception: 'Qabulxona', admin: 'Admin',
}[role] || role);

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '', language: 'uz' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data.data),
  });

  useEffect(() => {
    if (me) setForm({ name: me.name || '', phone: me.phone || '', language: me.language || 'uz' });
  }, [me]);

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/users/profile', d),
    onSuccess: ({ data }) => {
      updateUser(data.data);
      toast.success('Profil yangilandi');
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const pwMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success("Parol o'zgartirildi");
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err) => toast.error(friendlyAiErrorMessage(err)),
  });

  const submitPassword = () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error("Barcha maydonlarni to'ldiring");
    if (pwForm.newPassword.length < 6) return toast.error("Yangi parol kamida 6 ta belgidan iborat bo'lsin");
    if (pwForm.newPassword !== pwForm.confirm) return toast.error("Yangi parollar mos kelmadi");
    pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const { level, progress } = getLevelProgress(me?.xp || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 shadow-glow">
          {me?.name?.charAt(0) || <User size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-gray-800 dark:text-white truncate">{me?.name}</div>
          <div className="text-sm text-gray-400">@{me?.username}</div>
          <span className="badge text-xs bg-primary/10 text-primary mt-1">{roleLabel(me?.role)}</span>
        </div>
      </div>

      {/* Student stats */}
      {me?.role === 'student' && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-4">
            <Trophy size={18} className="mx-auto mb-1.5 text-amber-500" />
            <div className="text-lg font-bold text-gray-800 dark:text-white">{level}</div>
            <div className="text-xs text-gray-400">Daraja</div>
          </div>
          <div className="card text-center py-4">
            <Flame size={18} className="mx-auto mb-1.5 text-orange-500" />
            <div className="text-lg font-bold text-gray-800 dark:text-white">{me?.streak?.current || 0}</div>
            <div className="text-xs text-gray-400">Ketma-ketlik</div>
          </div>
          <div className="card text-center py-4">
            <BookOpen size={18} className="mx-auto mb-1.5 text-primary" />
            <div className="text-lg font-bold text-gray-800 dark:text-white">{me?.xp || 0}</div>
            <div className="text-xs text-gray-400">XP</div>
          </div>
        </div>
      )}
      {me?.role === 'student' && (me?.group || me?.teacher) && (
        <div className="card flex items-center gap-4 text-sm">
          {me?.group && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Users size={14} className="text-gray-400" /> {me.group.name}</div>}
          {me?.teacher && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><User size={14} className="text-gray-400" /> {me.teacher.name}</div>}
        </div>
      )}
      {me?.role === 'reception' && (
        <div className="grid grid-cols-1 gap-3">
          <div className="card flex items-center gap-3 py-3">
            <Building2 size={16} className="text-primary flex-shrink-0" />
            <span className="text-sm text-gray-500">Filiallaringizni "Filiallar" bo'limidan boshqaring</span>
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="card">
        <h2 className="font-bold text-sm mb-4 text-gray-800 dark:text-white">Shaxsiy ma'lumotlar</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To'liq ismi</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Phone size={11} /> Telefon raqami</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" type="tel" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><Globe size={11} /> Til</label>
            <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="input-field">
              <option value="uz">O'zbek</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save size={14} /> {saveMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-bold text-sm mb-4 text-gray-800 dark:text-white flex items-center gap-2">
          <KeyRound size={14} className="text-primary" /> Parolni o'zgartirish
        </h2>
        <div className="space-y-3">
          <input type="password" placeholder="Joriy parol" value={pwForm.currentPassword}
            onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} className="input-field" />
          <input type="password" placeholder="Yangi parol (kamida 6 ta belgi)" value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} className="input-field" />
          <input type="password" placeholder="Yangi parolni tasdiqlang" value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="input-field" />
          <button onClick={submitPassword} disabled={pwMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <KeyRound size={14} /> {pwMutation.isPending ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
          </button>
        </div>
      </div>
    </div>
  );
}
