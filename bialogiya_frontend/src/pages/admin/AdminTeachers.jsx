import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, UserCheck, Pencil, Trash2, Save, Users, GraduationCap, Phone, BookOpen, ChevronRight } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function AdminTeachers() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: teachers } = useQuery({
    queryKey: ['all-teachers'],
    queryFn: () => api.get('/admin/teachers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/teachers', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['all-teachers']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', email: '', language: 'uz' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/teachers/${id}`, data),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['all-teachers']);
      toast.success('O\'qituvchi yangilandi');
      setEditingTeacher(null);
      if (selectedTeacher?.id === data.data.id) {
        setSelectedTeacher(t => ({ ...t, ...data.data }));
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/teachers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['all-teachers']);
      toast.success('O\'qituvchi o\'chirildi');
      setSelectedTeacher(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries(['all-teachers']),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Nusxalandi!'); };

  const openEdit = (t, e) => {
    e?.stopPropagation();
    setEditingTeacher(t.id);
    setEditForm({ name: t.name, phone: t.phone || '', email: t.email || '' });
    setSelectedTeacher(null);
  };

  const handleDelete = (t, e) => {
    e?.stopPropagation();
    if (window.confirm(`"${t.name}" ni o'chirishni tasdiqlaysizmi?`)) {
      deleteMutation.mutate(t.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">O'qituvchilar</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> O'qituvchi qo'shish
        </button>
      </div>

      {/* Teacher list */}
      <div className="space-y-2">
        {teachers?.map((t, i) => {
          const isEditing = editingTeacher === t.id;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Tahrirlash</span>
                    <button onClick={() => setEditingTeacher(null)} className="btn-ghost p-1.5 rounded-lg"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Ismi *</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="input-field text-sm" placeholder="To'liq ismi" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Telefon</label>
                      <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        className="input-field text-sm" placeholder="+998 90 123 45 67" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Email</label>
                    <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="input-field text-sm" placeholder="email@example.com" type="email" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingTeacher(null)} className="btn-ghost flex-1 text-sm">Bekor</button>
                    <button
                      onClick={() => editForm.name && updateMutation.mutate({ id: t.id, data: editForm })}
                      disabled={!editForm.name || updateMutation.isPending}
                      className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-40">
                      <Save size={13} />
                      {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setSelectedTeacher(t)}>
                  <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {t.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-primary transition-colors">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>@{t.username}</span>
                      {t.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {t.phone}</span>}
                      {t.email && <span>{t.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-primary" /> {t._count?.taughtGroups || 0} guruh
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap size={12} className="text-secondary" /> {t._count?.students || 0} o'q
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(t.id); }}
                      className={`badge text-xs cursor-pointer ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'Faol' : 'Nofaol'}
                    </button>
                    <button onClick={(e) => openEdit(t, e)}
                      className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil size={13} />
                    </button>
                    <button onClick={(e) => handleDelete(t, e)}
                      className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {teachers?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <UserCheck size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali o'qituvchilar yo'q.</p>
          </div>
        )}
      </div>

      {/* Teacher detail modal */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelectedTeacher(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-gray-800 dark:text-white">O'qituvchi ma'lumoti</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(selectedTeacher)}
                    className="btn-ghost p-1.5 rounded-lg text-primary" title="Tahrirlash">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(selectedTeacher)}
                    className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => setSelectedTeacher(null)} className="btn-ghost p-1.5 rounded-lg ml-1">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-5">
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {selectedTeacher.name?.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedTeacher.name}</h3>
                <span className="text-sm text-gray-400 mt-0.5">@{selectedTeacher.username}</span>
                <span className={`mt-2 badge text-xs ${selectedTeacher.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedTeacher.isActive ? 'Faol' : 'Nofaol'}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Telefon raqami</div>
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">
                      {selectedTeacher.phone || '—'}
                    </div>
                  </div>
                  {selectedTeacher.phone && (
                    <button onClick={() => copy(selectedTeacher.phone)} className="btn-ghost p-1.5 rounded-lg">
                      <Copy size={13} />
                    </button>
                  )}
                </div>

                {selectedTeacher.email && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-xs font-bold">@</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">Email</div>
                      <div className="font-semibold text-sm text-gray-800 dark:text-white">{selectedTeacher.email}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={13} className="text-primary" />
                      <span className="text-xs text-gray-400">Guruhlar</span>
                    </div>
                    <div className="font-bold text-primary text-xl">{selectedTeacher._count?.taughtGroups || 0}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <GraduationCap size={13} className="text-secondary" />
                      <span className="text-xs text-gray-400">O'quvchilar</span>
                    </div>
                    <div className="font-bold text-secondary text-xl">{selectedTeacher._count?.students || 0}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen size={13} className="text-amber-500" />
                    <span className="text-xs text-gray-400">Darslar</span>
                  </div>
                  <div className="font-bold text-amber-600 text-xl">{selectedTeacher._count?.lessons || 0}</div>
                </div>
              </div>

              <button
                onClick={() => { toggleMutation.mutate(selectedTeacher.id); setSelectedTeacher(null); }}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm border border-gray-200 dark:border-gray-700">
                {selectedTeacher.isActive ? 'Hisobni o\'chirish' : 'Hisobni yoqish'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">O'qituvchi qo'shish</h2>
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">O'qituvchi qo'shildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni o'qituvchiga bering</p>
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
                      placeholder="O'qituvchi ismi" className="input-field" />
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
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Til</label>
                    <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="input-field">
                      <option value="uz">O'zbek</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => form.name && createMutation.mutate(form)}
                      disabled={!form.name || createMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {createMutation.isPending ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
