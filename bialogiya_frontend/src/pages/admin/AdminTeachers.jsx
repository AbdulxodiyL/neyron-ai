import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Trash2, X, UserCheck } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function AdminTeachers() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);

  const { data: teachers } = useQuery({ queryKey: ['all-teachers'], queryFn: () => api.get('/admin/teachers').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/teachers', d),
    onSuccess: ({ data }) => { qc.invalidateQueries(['all-teachers']); setNewCreds(data.data.credentials); setForm({ name: '', email: '', language: 'uz' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['all-teachers']); toast.success('Status updated'); },
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Teachers</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Teacher</button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Add Teacher</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>
              {newCreds ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-bold text-green-600 mb-1">Teacher Created!</h3>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-3 space-y-3 text-left">
                    {[['Username', newCreds.username], ['Password', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div><div className="text-xs text-gray-500">{label}</div><div className="font-mono font-bold">{val}</div></div>
                        <button onClick={() => copy(val)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setNewCreds(null)} className="btn-primary w-full mt-4">Add Another</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Teacher name" className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Language</label>
                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="input-field">
                      <option value="uz">O'zbek</option><option value="ru">Русский</option><option value="en">English</option>
                    </select></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={() => form.name && createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {teachers?.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{t.name?.charAt(0)}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.name}</div>
              <div className="text-xs text-gray-400">@{t.username} {t.email && `• ${t.email}`}</div>
            </div>
            <div className="text-xs text-gray-400">{t.groupCount || 0} groups</div>
            <button onClick={() => toggleMutation.mutate(t._id)}
              className={`badge text-xs cursor-pointer ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {t.isActive ? 'Active' : 'Inactive'}
            </button>
          </motion.div>
        ))}
        {teachers?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserCheck size={36} className="mx-auto mb-3 opacity-30" />
            <p>No teachers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
