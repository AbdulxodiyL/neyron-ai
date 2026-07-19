import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, X, Copy, KeyRound, User,
  Phone, Hash, RefreshCw, Loader2, CheckCircle2
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const fmt = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0';

export default function ReceptionGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [creds, setCreds] = useState(null);           // fetched creds for selected student
  const [showAdd, setShowAdd] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', language: 'uz' });
  const [newCreds, setNewCreds] = useState(null);

  const { data: group, isLoading } = useQuery({
    queryKey: ['reception-group-detail', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', { ...d, groupId: id }),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['reception-group-detail', id]);
      setNewCreds(data.data.credentials);
      setForm({ name: '', phone: '', language: 'uz' });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Xato"),
  });

  const deleteMutation = useMutation({
    mutationFn: (sid) => api.delete(`/users/${sid}`),
    onSuccess: () => {
      qc.invalidateQueries(['reception-group-detail', id]);
      setSelectedStudent(null);
      setCreds(null);
    },
    onError: () => toast.error("O'chirishda xato"),
  });

  const resetMutation = useMutation({
    mutationFn: (sid) => api.post(`/users/${sid}/reset-password`, {}),
    onSuccess: ({ data }) => {
      setCreds(data.data);
      toast.success("Parol tiklandi");
    },
    onError: () => toast.error("Parol tiklashda xato"),
  });

  const openStudent = (s) => {
    setSelectedStudent(s);
    // Show known credentials based on phone last-4 pattern
    const last4 = (s.phone || '').replace(/\D/g, '').slice(-4);
    setCreds({ username: s.username, password: last4.length === 4 ? last4 : '????', phone: s.phone });
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Nusxalandi"); };

  const students = group?.students || [];
  const monthlyFee = group?.monthlyFee || 0;

  if (isLoading) return (
    <div className="flex justify-center items-center h-40">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reception/groups')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{group?.name}</h1>
          <p className="text-sm text-gray-400">
            {group?.teacher?.name || 'O\'qituvchi biriktirilmagan'} · {students.length} o'quvchi
            {monthlyFee > 0 && ` · ${fmt(monthlyFee)} so'm/oy`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> O'quvchi qo'shish
        </button>
      </div>

      {/* Students table */}
      <div className="card overflow-hidden p-0">
        {students.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali o'quvchi qo'shilmagan.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">O'quvchi</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Login</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Telefon</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">XP</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">Holat</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openStudent(s)}
                  className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-primary/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {s.name?.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">@{s.username}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{s.xp || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge text-xs ${s.isFrozen ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {s.isFrozen ? 'Muzlatilgan' : 'Faol'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Student account modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setSelectedStudent(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold">
                    {selectedStudent.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">{selectedStudent.name}</div>
                    <div className="text-xs text-gray-400">{selectedStudent.isFrozen ? '❄️ Muzlatilgan' : '✅ Faol'}</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedStudent(null); setCreds(null); }} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {/* Account credentials */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 space-y-3">
                {[
                  { icon: <Hash size={13} />, label: 'Login', value: creds?.username },
                  { icon: <KeyRound size={13} />, label: 'Parol', value: creds?.password },
                  { icon: <Phone size={13} />, label: 'Telefon', value: creds?.phone },
                ].map(({ icon, label, value }) => value && (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-gray-800 dark:text-white">{value}</span>
                      <button onClick={() => copy(value)} className="text-gray-400 hover:text-primary transition-colors">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-gray-400 mb-4 text-center">
                Parol = telefon raqamining oxirgi 4 ta raqami
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => resetMutation.mutate(selectedStudent.id)}
                  disabled={resetMutation.isPending}
                  className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-xs"
                >
                  {resetMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Parolni tiklash
                </button>
                <button
                  onClick={() => {
                    setConfirm({
                      title: `"${selectedStudent.name}"ni o'chirish`,
                      message: "O'quvchi guruhdan va tizimdan to'liq o'chiriladi.",
                      onConfirm: () => deleteMutation.mutate(selectedStudent.id),
                    });
                  }}
                  disabled={deleteMutation.isPending}
                  className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  O'chirish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add student modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">O'quvchi qo'shish</h2>
                <button onClick={() => { setShowAdd(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg">
                  <X size={16} />
                </button>
              </div>

              {newCreds ? (
                <div>
                  <div className="text-center mb-4">
                    <CheckCircle2 size={40} className="mx-auto mb-2 text-green-500" />
                    <h3 className="font-bold text-green-600">O'quvchi qo'shildi!</h3>
                    <p className="text-xs text-gray-400 mt-1">Login va parolni o'quvchiga bering</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 mb-4">
                    {[['Login', newCreds.username], ['Parol', newCreds.password]].map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">{label}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{val}</span>
                          <button onClick={() => copy(val)} className="text-gray-400 hover:text-primary"><Copy size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-center text-gray-400 mb-4">Parol = telefon raqamning oxirgi 4 ta raqami</p>
                  <button onClick={() => setNewCreds(null)} className="btn-primary w-full">Yana qo'shish</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">To'liq ismi *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Ism Familiya" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami * <span className="text-gray-400 text-xs">(login va parol uchun)</span></label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67" type="tel" className="input-field" />
                    {form.phone.replace(/\D/g, '').slice(-4).length === 4 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Parol bo'ladi: <span className="font-mono font-semibold text-primary">{form.phone.replace(/\D/g, '').slice(-4)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAdd(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => form.name && form.phone && addMutation.mutate(form)}
                      disabled={!form.name || !form.phone || addMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {addMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
                    </button>
                  </div>
                  {addMutation.isError && (
                    <p className="text-xs text-red-500 text-center">{addMutation.error?.response?.data?.message || "Xato"}</p>
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
