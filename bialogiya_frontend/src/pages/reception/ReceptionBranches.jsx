import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Building2, MapPin } from 'lucide-react';
import api from '../../config/axios';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const MAX_BRANCHES = 3;

export default function ReceptionBranches() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });

  const { data: branches } = useQuery({
    queryKey: ['reception-branches'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/reception/branches', d),
    onSuccess: () => {
      qc.invalidateQueries(['reception-branches']);
      setForm({ name: '', address: '' });
      setShowCreate(false);
    },
  });

  const count = branches?.length || 0;
  const atLimit = count >= MAX_BRANCHES;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Filiallar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{count} / {MAX_BRANCHES} filial ochilgan</p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={atLimit} className="btn-primary flex items-center gap-2 disabled:opacity-40">
          <Plus size={15} /> Filial qo'shish
        </button>
      </div>

      {atLimit && (
        <p className="text-xs text-amber-500 mb-4 text-center">
          Bitta qabulxona hisobi ko'pi bilan {MAX_BRANCHES} ta filial ochishi mumkin.
        </p>
      )}

      <div className="space-y-2">
        {branches?.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Building2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{b.name}</div>
              {b.address && <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {b.address}</div>}
            </div>
            <span className="badge text-xs bg-primary/10 text-primary">{b._count?.groups || 0} guruh</span>
          </motion.div>
        ))}
        {branches?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali filial ochilmagan.</p>
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
                <h2 className="font-bold text-lg">Filial qo'shish</h2>
                <button onClick={() => setShowCreate(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Filial nomi *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Masalan: Chilonzor filiali" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Manzil</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Ko'cha, uy raqami" className="input-field" />
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
