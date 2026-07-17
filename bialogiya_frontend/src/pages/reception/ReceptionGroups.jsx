import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Trash2, ChevronRight, X, UserCheck, GraduationCap } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { SUBJECTS, SUBJECT_LABELS, getSubjectLabel } from '../../utils/subjects';

const ICONS = ['🧬', '⚗️', '📚', '🔬', '🧪', '💊', '🌿', '🦠', '📐', '🌍', '🕰️', '💻'];

export default function ReceptionGroups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', subject: 'biology', customSubject: '', icon: '🧬', color: '#00BFA6', teacherId: '' });

  const { data: groups, isLoading } = useQuery({
    queryKey: ['reception-all-groups'],
    queryFn: () => api.get('/reception/all-groups').then(r => r.data.data),
  });

  const { data: allTeachers } = useQuery({
    queryKey: ['reception-teachers'],
    queryFn: () => api.get('/reception/teachers').then(r => r.data.data),
    onSuccess: (data) => setTeachers(data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/reception/groups', {
      ...d,
      subject: d.subject === 'other' ? (d.customSubject.trim() || 'other') : d.subject,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['reception-all-groups']);
      qc.invalidateQueries(['reception-teachers']);
      setShowCreate(false);
      toast.success('Group created!');
      setForm({ name: '', description: '', subject: 'biology', customSubject: '', icon: '🧬', color: '#00BFA6', teacherId: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/reception/groups/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['reception-all-groups']);
      toast.success('Group deleted');
    },
  });

  const handleCreateGroup = () => {
    if (!form.name || !form.teacherId) {
      toast.error('Group name and teacher are required');
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Guruhlar</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yangi guruh
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Yangi guruh yaratish</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Guruh nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="masalan: Biologiya guruh A" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">O'qituvchi *</label>
                  <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className="input-field">
                    <option value="">O'qituvchini tanlang</option>
                    {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fan</label>
                  <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field">
                    {SUBJECTS.map(s => <option key={s} value={s}>{SUBJECT_LABELS[s] || s}</option>)}
                  </select>
                  {form.subject === 'other' && (
                    <input value={form.customSubject} onChange={e => setForm(f => ({ ...f, customSubject: e.target.value }))}
                      placeholder="Fan nomini kiriting" className="input-field mt-2" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {ICONS.map(icon => (
                      <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                        className={`w-9 h-9 rounded-xl text-xl hover:bg-primary/10 transition-all ${form.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : 'bg-gray-100'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tavsif</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Guruh tavsifi (ixtiyoriy)" className="input-field" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                <button onClick={handleCreateGroup}
                  disabled={!form.name || !form.teacherId || createMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-40">
                  {createMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4">
        {groups?.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/reception/groups/${g.id}`)}
            className="card hover:shadow-soft transition-all cursor-pointer hover:border-primary/30 hover:bg-primary/2 group">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-2xl">{g.icon || '📚'}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{g.name}</h3>
                <span className={`badge text-xs mt-0.5 ${g.subject === 'biology' ? 'bg-green-100 text-green-700' : g.subject === 'chemistry' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-600'}`}>
                  {getSubjectLabel(g.subject)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); if (window.confirm('Guruhni o\'chirish?')) deleteMutation.mutate(g.id); }}
                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <UserCheck size={14} />
              <span>O'qituvchi: {g.teacher?.name || 'Ma\'lumot yo\'q'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users size={14} />
              <span>{g._count?.students || 0} o'quvchi</span>
            </div>
            {g.description && <p className="text-xs text-gray-400 mt-2">{g.description}</p>}
          </motion.div>
        ))}
        {!isLoading && groups?.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Guruhlar hali yaratilmagan. Birinchi guruhni yarating!</p>
          </div>
        )}
      </div>
    </div>
  );
}