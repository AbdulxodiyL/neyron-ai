import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users2, ChevronRight } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

export default function ReceptionGroups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', subject: 'biology', teacherId: '', branchId: '', monthlyFee: '' });

  const { data: groups } = useQuery({
    queryKey: ['reception-groups'],
    queryFn: () => api.get('/reception/groups').then(r => r.data.data),
  });
  const { data: teachers } = useQuery({
    queryKey: ['reception-teachers'],
    queryFn: () => api.get('/reception/teachers').then(r => r.data.data),
  });
  const { data: branches } = useQuery({
    queryKey: ['reception-branches'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/groups', d),
    onSuccess: () => {
      qc.invalidateQueries(['reception-groups']);
      setForm({ name: '', subject: 'biology', teacherId: '', branchId: '', monthlyFee: '' });
      setShowCreate(false);
    },
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Guruhlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Yangi guruh yarating va o'qituvchi biriktiring</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Guruh yaratish
        </button>
      </div>

      <div className="space-y-2">
        {groups?.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/reception/groups/${g.id}`)}
            className="card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Users2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{g.name}</div>
              <div className="text-xs text-gray-400">
                {g.teacher?.name || 'O\'qituvchi biriktirilmagan'} · {g._count?.students || 0} o'quvchi
                {g.branch && ` · ${g.branch.name}`}
              </div>
            </div>
            {g.monthlyFee > 0 && (
              <span className="badge text-xs bg-primary/10 text-primary">{new Intl.NumberFormat('uz-UZ').format(g.monthlyFee)} so'm/oy</span>
            )}
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </motion.div>
        ))}
        {groups?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali guruh yaratilmagan.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Guruh yaratish</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Guruh nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Biologiya-1" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">O'qituvchi *</label>
                  <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className="input-field">
                    <option value="">Tanlang</option>
                    {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Filial</label>
                  <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className="input-field">
                    <option value="">Tanlanmagan</option>
                    {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Oylik to'lov summasi (so'm)</label>
                  <input value={form.monthlyFee} onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Masalan: 500000" inputMode="numeric" className="input-field" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                  <button
                    onClick={() => form.name && form.teacherId && createMutation.mutate(form)}
                    disabled={!form.name || !form.teacherId || createMutation.isPending}
                    className="btn-primary flex-1 disabled:opacity-40">
                    {createMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
                  </button>
                </div>
                {createMutation.isError && (
                  <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(createMutation.error)}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
