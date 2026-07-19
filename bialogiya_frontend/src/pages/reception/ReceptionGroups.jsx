import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users2, ChevronRight, Clock, Calendar, DoorOpen, Building2 } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const DAYS = [
  { key: 'mon', label: 'Du' }, { key: 'tue', label: 'Se' }, { key: 'wed', label: 'Cho' },
  { key: 'thu', label: 'Pa' }, { key: 'fri', label: 'Ju' }, { key: 'sat', label: 'Sha' },
  { key: 'sun', label: 'Ya' },
];

const formatSchedule = (g) => {
  const parts = [];
  if (g.weekDays) {
    try {
      const days = JSON.parse(g.weekDays);
      const labels = days.map(d => DAYS.find(x => x.key === d)?.label).filter(Boolean);
      if (labels.length) parts.push(labels.join(', '));
    } catch {}
  }
  if (g.startTime) parts.push(g.startTime + (g.endTime ? `–${g.endTime}` : ''));
  if (g.room) parts.push(g.room);
  return parts.join(' · ');
};

const EMPTY_FORM = { name: '', subject: 'biology', teacherId: '', branchId: '', monthlyFee: '', weekDays: [], startTime: '', endTime: '', room: '' };

export default function ReceptionGroups() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: groups } = useQuery({ queryKey: ['reception-groups'], queryFn: () => api.get('/reception/groups').then(r => r.data.data) });
  const { data: teachers } = useQuery({ queryKey: ['reception-teachers'], queryFn: () => api.get('/admin/teachers').then(r => r.data.data) });
  const { data: branches } = useQuery({ queryKey: ['reception-branches'], queryFn: () => api.get('/reception/branches').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/groups', { ...d, monthlyFee: d.monthlyFee ? Number(d.monthlyFee) : null }),
    onSuccess: () => { qc.invalidateQueries(['reception-groups']); setForm(EMPTY_FORM); setShowCreate(false); },
  });

  const toggleDay = (day) => setForm(f => ({
    ...f, weekDays: f.weekDays.includes(day) ? f.weekDays.filter(d => d !== day) : [...f.weekDays, day],
  }));

  const canSubmit = form.name && form.teacherId && !createMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Guruhlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guruh yarating, jadval va xona belgilang</p>
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
              <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                <span>{g.teacher?.name || "O'qituvchi biriktirilmagan"}</span>
                <span>·</span>
                <span>{g._count?.students || 0} o'quvchi</span>
                {g.branch && <><span>·</span><span className="flex items-center gap-0.5"><Building2 size={10} />{g.branch.name}</span></>}
              </div>
              {formatSchedule(g) && (
                <div className="text-xs text-primary/80 mt-0.5 flex items-center gap-1">
                  <Calendar size={10} />
                  {formatSchedule(g)}
                </div>
              )}
            </div>
            {g.monthlyFee > 0 && (
              <span className="badge text-xs bg-primary/10 text-primary whitespace-nowrap">
                {new Intl.NumberFormat('uz-UZ').format(g.monthlyFee)} so'm/oy
              </span>
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

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md my-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg">Guruh yaratish</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Guruh nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Biologiya-1A" className="input-field" />
                </div>

                {/* Teacher */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">O'qituvchi *</label>
                  <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} className="input-field">
                    <option value="">Tanlang</option>
                    {teachers?.map(t => <option key={t.id} value={t.id}>{t.name}{t.branch ? ` (${t.branch.name})` : ''}</option>)}
                  </select>
                </div>

                {/* Branch */}
                {branches?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-1"><Building2 size={13} /> Filial</label>
                    <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className="input-field">
                      <option value="">Tanlanmagan</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Week days */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-1"><Calendar size={13} /> Hafta kunlari</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map(d => (
                      <button key={d.key} type="button"
                        onClick={() => toggleDay(d.key)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${form.weekDays.includes(d.key) ? 'gradient-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-1"><Clock size={13} /> Dars vaqti</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="input-field flex-1" />
                    <span className="text-gray-400 text-sm">—</span>
                    <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="input-field flex-1" />
                  </div>
                </div>

                {/* Room */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-1"><DoorOpen size={13} /> Xona</label>
                  <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                    placeholder="Masalan: 3-xona, 2-qavat" className="input-field" />
                </div>

                {/* Monthly fee */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Oylik to'lov (so'm)</label>
                  <input value={form.monthlyFee} onChange={e => setForm(f => ({ ...f, monthlyFee: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Masalan: 500000" inputMode="numeric" className="input-field" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                  <button onClick={() => canSubmit && createMutation.mutate(form)}
                    disabled={!canSubmit}
                    className="btn-primary flex-1 disabled:opacity-40">
                    {createMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
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
