import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, UserCheck, Pencil, Trash2, Save, Users, GraduationCap, Phone, BookOpen } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function AdminTeachers() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', language: 'uz', branchId: '' });
  const [newCreds, setNewCreds] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [branchFilter, setBranchFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const { data: branches } = useQuery({
    queryKey: ['branches-for-filter'],
    queryFn: () => api.get('/reception/branches').then(r => r.data.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['all-teachers', branchFilter],
    queryFn: () => api.get('/admin/teachers', { params: branchFilter ? { branchId: branchFilter } : {} }).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/teachers', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['all-teachers']);
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', email: '', language: 'uz', branchId: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/teachers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['all-teachers']);
      toast.success('O\'qituvchi yangilandi');
      setEditingId(null);
      setSelectedTeacher(null);
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

  const openEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, phone: t.phone || '', email: t.email || '', branchId: t.branch?.id || '' });
    setSelectedTeacher(null);
  };

  const handleDelete = (t) => {
    setConfirm({
      title: `"${t.name}"ni o'chirish`,
      message: "O'qituvchi hisobi to'liq yashiriladi va tizimga kira olmaydi.",
      warning: "Guruhlarni oldin boshqa o'qituvchiga biriktiring.",
      onConfirm: () => deleteMutation.mutate(t.id),
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">O'qituvchilar</h1>
        <div className="flex items-center gap-2">
          {branches?.length > 0 && (
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="input-field text-sm py-2">
              <option value="">Barcha filiallar</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> O'qituvchi qo'shish
          </button>
        </div>
      </div>

      {/* Teacher list */}
      <div className="space-y-2">
        {teachers?.map((t, i) => {
          const isEditing = editingId === t.id;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">Tahrirlash</span>
                    <button onClick={() => setEditingId(null)} className="btn-ghost p-1.5 rounded-lg"><X size={14} /></button>
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
                  {branches?.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Filial</label>
                      <select value={editForm.branchId} onChange={e => setEditForm(f => ({ ...f, branchId: e.target.value }))} className="input-field text-sm">
                        <option value="">Filialsiz</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingId(null)} className="btn-ghost flex-1 text-sm">Bekor</button>
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
                <div className="flex items-center gap-3">
                  {/* Clickable area for detail */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTeacher(t)}>
                    <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {t.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 dark:text-white hover:text-primary transition-colors">
                        {t.name}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                        <span>@{t.username}</span>
                        {t.phone && <span className="flex items-center gap-0.5"><Phone size={10} /> {t.phone}</span>}
                        {t.email && <span>{t.email}</span>}
                        {t.branch && <span className="badge bg-primary/10 text-primary text-[10px]">{t.branch.name}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-primary" /> {t._count?.taughtGroups || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap size={12} className="text-secondary" /> {t._count?.students || 0}
                      </span>
                    </div>
                  </div>
                  {/* Always-visible action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { toggleMutation.mutate(t.id); }}
                      className={`badge text-xs cursor-pointer ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'Faol' : 'Nofaol'}
                    </button>
                    <button onClick={() => openEdit(t)}
                      className="btn-ghost p-2 rounded-lg text-primary hover:bg-primary/10" title="Tahrirlash">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t)}
                      className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="O'chirish">
                      <Trash2 size={14} />
                    </button>
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
                    className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Tahrirlash">
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

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Telefon</div>
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">{selectedTeacher.phone || '—'}</div>
                  </div>
                  {selectedTeacher.phone && (
                    <button onClick={() => copy(selectedTeacher.phone)} className="btn-ghost p-1.5 rounded-lg"><Copy size={13} /></button>
                  )}
                </div>

                {selectedTeacher.email && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-600 text-xs font-bold">@</div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">Email</div>
                      <div className="font-semibold text-sm text-gray-800 dark:text-white">{selectedTeacher.email}</div>
                    </div>
                  </div>
                )}

                {selectedTeacher.branch && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400">Filial</div>
                      <div className="font-semibold text-sm text-gray-800 dark:text-white">{selectedTeacher.branch.name}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => { const p = location.pathname.startsWith('/admin') ? 'admin' : 'reception'; navigate(`/${p}/teachers/${selectedTeacher.id}?tab=groups`); }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Users size={16} className="text-primary mx-auto mb-1" />
                    <div className="font-bold text-primary text-lg">{selectedTeacher._count?.taughtGroups || 0}</div>
                    <div className="text-xs text-gray-400">Guruh</div>
                  </button>
                  <button onClick={() => { const p = location.pathname.startsWith('/admin') ? 'admin' : 'reception'; navigate(`/${p}/teachers/${selectedTeacher.id}?tab=students`); }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <GraduationCap size={16} className="text-secondary mx-auto mb-1" />
                    <div className="font-bold text-secondary text-lg">{selectedTeacher._count?.students || 0}</div>
                    <div className="text-xs text-gray-400">O'quvchi</div>
                  </button>
                  <button onClick={() => { const p = location.pathname.startsWith('/admin') ? 'admin' : 'reception'; navigate(`/${p}/teachers/${selectedTeacher.id}?tab=lessons`); }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <BookOpen size={16} className="text-amber-500 mx-auto mb-1" />
                    <div className="font-bold text-amber-600 text-lg">{selectedTeacher._count?.lessons || 0}</div>
                    <div className="text-xs text-gray-400">Dars</div>
                  </button>
                </div>
              </div>

              <button onClick={() => { toggleMutation.mutate(selectedTeacher.id); setSelectedTeacher(null); }}
                className="btn-ghost w-full flex items-center justify-center gap-2 text-sm border border-gray-200 dark:border-gray-700">
                {selectedTeacher.isActive ? 'Hisobni o\'chirish' : 'Hisobni yoqish'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create teacher modal */}
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
                  {branches?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Filial</label>
                      <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))} className="input-field">
                        <option value="">Filialsiz</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
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
