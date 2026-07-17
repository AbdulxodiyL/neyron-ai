import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, X, GraduationCap, Phone, Users, Star, Zap, Pencil, Trash2, Save, ChevronLeft, UserCheck } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function ReceptionGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: group } = useQuery({
    queryKey: ['reception-group', id],
    queryFn: () => api.get(`/reception/groups/${id}`).then(r => r.data.data),
  });

  const { data: groups } = useQuery({
    queryKey: ['reception-all-groups'],
    queryFn: () => api.get('/reception/all-groups').then(r => r.data.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['reception-teachers'],
    queryFn: () => api.get('/reception/teachers').then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/reception/students', { ...d, groupId: id }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['reception-group', id]);
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', language: 'uz' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ studentId, data }) => api.put(`/reception/students/${studentId}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['reception-group', id]);
      toast.success('O\'quvchi yangilandi');
      setEditingStudent(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (studentId) => api.delete(`/reception/students/${studentId}`),
    onSuccess: () => {
      qc.invalidateQueries(['reception-group', id]);
      toast.success('O\'quvchi o\'chirildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const freezeMutation = useMutation({
    mutationFn: (studentId) => api.patch(`/reception/students/${studentId}/freeze`),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['reception-group', id]);
      toast.success(data.isFrozen ? 'O\'quvchi muzlatildi' : 'O\'quvchi muzlatdan chiqarildi');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Nusxalandi!'); };

  const handleUpdate = () => {
    if (!editForm.name) return toast.error('Ism kiritilmagan');
    updateMutation.mutate({ studentId: editingStudent, data: editForm });
  };

  const handleDelete = (s) => {
    if (window.confirm(`"${s.name}" ni o'chirishni tasdiqlaysizmi?`)) {
      deleteMutation.mutate(s.id);
    }
  };

if (!group) {
    return <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-lg mr-2">
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{group.name}</h1>
      </div>

      <div className="mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-2xl">
            {group.icon || '📚'}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 dark:text-white">{group.name}</div>
            <div className="text-xs text-gray-400">
              O'qituvchi: {group.teacher?.name || 'Ma\'lumot yo\'q'} • {group.subject && `Fan: ${group.subject}`}
            </div>
            {group.description && <div className="text-xs text-gray-500 mt-1">{group.description}</div>}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-bold">{group._count?.students || 0}</span> o'quvchi
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">O'quvchilar ({group.students?.length || 0})</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> O'quvchi qo'shish
        </button>
      </div>

      <div className="space-y-2">
        {group.students?.map((s, i) => {
          const isEditing = editingStudent === s.id;
          return (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-primary">Tahrirlash</span>
                    <button onClick={() => setEditingStudent(null)} className="btn-ghost p-1.5 rounded-lg"><X size={14} /></button>
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
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingStudent(null)} className="btn-ghost flex-1 text-sm">Bekor</button>
                    <button onClick={handleUpdate} disabled={updateMutation.isPending}
                      className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-40">
                      <Save size={13} />
                      {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                      <span>@{s.username}</span>
                      {s.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone size={10} /> {s.phone}
                        </span>
                      )}
                      {s.isFrozen && (
                        <span className="flex items-center gap-0.5">
                          <UserCheck size={10} /> Muzlatilgan
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="badge bg-primary/10 text-primary text-xs">Lv.{s.level}</span>
                    <span className="text-xs text-gray-400">{s.xp} XP</span>
                    <button onClick={() => { setEditingStudent(s.id); setEditForm({ name: s.name, phone: s.phone || '' }); }}
                      className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Tahrirlash">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => freezeMutation.mutate(s.id)}
                      disabled={freezeMutation.isPending}
                      className="btn-ghost p-1.5 rounded-lg text-blue-400 hover:bg-blue-50" title={s.isFrozen ? "Muzlatdan chiqarish" : "Muzlatish"}>
                      <UserCheck size={13} />
                    </button>
                    <button onClick={() => handleDelete(s)}
                      className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {group.students?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>Bu guruhda o'quvchi yo'q.</p>
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
                <button onClick={() => { setShowCreate(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-green-600">O'quvchi qo'shildi!</h3>
                    <p className="text-sm text-gray-500 mt-1">Bu ma'lumotlarni o'quvchiga bering</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs text-gray-500">Login</div><div className="font-mono font-bold">{newCreds.username}</div></div>
                      <button onClick={() => copy(newCreds.username)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div><div className="text-xs text-gray-500">Parol</div><div className="font-mono font-bold">{newCreds.password}</div></div>
                      <button onClick={() => copy(newCreds.password)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
                    </div>
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
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67" type="tel" className="input-field" />
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