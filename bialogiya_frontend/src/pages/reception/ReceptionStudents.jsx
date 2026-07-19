import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, GraduationCap, Trash2 } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function ReceptionStudents() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', groupId: '', phone: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [branchFilter, setBranchFilter] = useState('');

  const { data: branches } = useQuery({
    queryKey: ['reception-branches-for-filter'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const { data: groups } = useQuery({
    queryKey: ['reception-groups'],
    queryFn: () => api.get('/reception/groups').then(r => r.data.data),
  });

  const visibleGroups = branchFilter ? groups?.filter(g => g.branch?.id === branchFilter) : groups;

  // No single "all students" endpoint for reception - list per selected group instead.
  const [filterGroupId, setFilterGroupId] = useState('');
  const { data: group } = useQuery({
    queryKey: ['reception-group-detail', filterGroupId],
    queryFn: () => api.get(`/groups/${filterGroupId}`).then(r => r.data.data),
    enabled: !!filterGroupId,
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['reception-group-detail']);
      qc.invalidateQueries(['reception-groups']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', groupId: form.groupId, phone: '', language: 'uz' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['reception-group-detail']);
      qc.invalidateQueries(['reception-groups']);
    },
  });

  const [confirm, setConfirm] = useState(null);
  const copy = (text) => navigator.clipboard.writeText(text);
  const handleDelete = (s) => {
    setConfirm({
      title: `"${s.name}"ni o'chirish`,
      message: "O'quvchi tizimdan to'liq o'chiriladi.",
      onConfirm: () => deleteMutation.mutate(s.id),
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">O'quvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guruh tanlang, so'ng o'quvchi qo'shing</p>
        </div>
        <button onClick={() => { setForm(f => ({ ...f, groupId: filterGroupId })); setShowCreate(true); }}
          disabled={!visibleGroups?.length} className="btn-primary flex items-center gap-2 disabled:opacity-40">
          <Plus size={15} /> O'quvchi qo'shish
        </button>
      </div>

      {branches?.length > 1 && (
        <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setFilterGroupId(''); }} className="input-field w-full mb-3">
          <option value="">Barcha filiallar</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}

      <select value={filterGroupId} onChange={e => setFilterGroupId(e.target.value)} className="input-field w-full mb-5">
        <option value="">Guruhni tanlang</option>
        {visibleGroups?.map(g => <option key={g.id} value={g.id}>{g.name}{g.branch ? ` — ${g.branch.name}` : ''}</option>)}
      </select>

      <div className="space-y-2">
        {group?.students?.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {s.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
              <div className="text-xs text-gray-400">@{s.username}</div>
            </div>
            <button onClick={() => handleDelete(s)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {filterGroupId && group?.students?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>Bu guruhda hali o'quvchi yo'q.</p>
          </div>
        )}
        {!filterGroupId && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>O'quvchilarni ko'rish uchun avval guruh tanlang.</p>
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
                <h2 className="font-bold text-lg">O'quvchi qo'shish</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">O'quvchi qo'shildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni o'quvchiga bering</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">{label}</div>
                          <div className="font-mono font-bold">{val}</div>
                        </div>
                        <button onClick={() => copy(val)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setNewCreds(null)} className="btn-primary w-full mt-4">Yana qo'shish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">To'liq ismi *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="O'quvchi ismi" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Guruh *</label>
                    <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
                      <option value="">Tanlang</option>
                      {visibleGroups?.map(g => <option key={g.id} value={g.id}>{g.name}{g.branch ? ` — ${g.branch.name}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67" type="tel" className="input-field" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => form.name && form.groupId && createMutation.mutate(form)}
                      disabled={!form.name || !form.groupId || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {createMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
                    </button>
                  </div>
                  {createMutation.isError && (
                    <p className="text-xs text-red-500 text-center">{friendlyAiErrorMessage(createMutation.error)}</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
