import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, UserCog, Phone, Trash2 } from 'lucide-react';
import api from '../../config/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

export default function AdminReception() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data: users } = useQuery({
    queryKey: ['admin-reception'],
    queryFn: () => api.get('/admin/reception').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/reception', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['admin-reception']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', email: '', language: 'uz' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/reception/${id}`),
    onSuccess: () => qc.invalidateQueries(['admin-reception']),
  });

  const copy = (text) => navigator.clipboard.writeText(text);

  const handleDelete = (u) => {
    setConfirm({
      title: `"${u.name}"ni o'chirish`,
      message: "Qabulxona xodimi tizimga kira olmaydi.",
      onConfirm: () => deleteMutation.mutate(u.id),
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Qabulxona</h1>
          <p className="text-sm text-gray-500 mt-0.5">Faqat siz qabulxona hisoblarini yaratishingiz mumkin</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Hisob qo'shish
        </button>
      </div>

      <div className="space-y-2">
        {users?.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {u.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{u.name}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>@{u.username}</span>
                {u.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {u.phone}</span>}
              </div>
            </div>
            <span className={`badge text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {u.isActive ? 'Faol' : 'Nofaol'}
            </span>
            <button onClick={() => handleDelete(u)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
              <Trash2 size={14} />
            </button>
          </motion.div>
        ))}
        {users?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserCog size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali qabulxona hisoblari yo'q.</p>
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
                <h2 className="font-bold text-lg">Qabulxona hisobi qo'shish</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">Hisob yaratildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni xodimga bering</p>
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
                      placeholder="Xodim ismi" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67" type="tel" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com" type="email" className="input-field" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => form.name && createMutation.mutate(form)}
                      disabled={!form.name || createMutation.isPending}
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
