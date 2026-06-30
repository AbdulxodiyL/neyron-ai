import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, RefreshCw, X, GraduationCap } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function ManageStudents() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', groupId: '', email: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);

  const { data: students } = useQuery({ queryKey: ['my-students'], queryFn: () => api.get('/users/my-students').then(r => r.data.data) });
  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['my-students']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', groupId: '', email: '', language: 'uz' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id) => api.post(`/users/${id}/reset-password`),
    onSuccess: ({ data }) => toast.success(`New password: ${data.data.newPassword}`, { duration: 8000 }),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Students</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Student</button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Add Student</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">Student Created!</h3>
                    <p className="text-sm text-gray-500 mt-1">Share these credentials with the student</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs text-gray-500">Username</div><div className="font-mono font-bold">{newCreds.username}</div></div>
                      <button onClick={() => copy(newCreds.username)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs text-gray-500">Password</div><div className="font-mono font-bold">{newCreds.password}</div></div>
                      <button onClick={() => copy(newCreds.password)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => { setNewCreds(null); }} className="btn-primary w-full mt-4">Add Another</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1.5">Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student name" className="input-field" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Group *</label>
                    <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
                      <option value="">Select group</option>
                      {groups?.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-medium mb-1.5">Language</label>
                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="input-field">
                      <option value="uz">O'zbek</option><option value="ru">Русский</option><option value="en">English</option>
                    </select></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancel</button>
                    <button onClick={() => form.name && form.groupId && createMutation.mutate(form)} disabled={!form.name || !form.groupId || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {students?.map((s, i) => (
          <motion.div key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {s.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
              <div className="text-xs text-gray-400">@{s.username} • {s.group?.name || 'No group'}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="badge bg-primary/10 text-primary">Lv.{s.level}</span>
              <span>{s.xp} XP</span>
            </div>
            <button onClick={() => { if (window.confirm('Reset password?')) resetPwMutation.mutate(s._id); }}
              className="btn-ghost p-1.5 rounded-lg text-gray-400 hover:text-primary"><RefreshCw size={14} /></button>
          </motion.div>
        ))}
        {students?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>No students yet. Add your first student!</p>
          </div>
        )}
      </div>
    </div>
  );
}
