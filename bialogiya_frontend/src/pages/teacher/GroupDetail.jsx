import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Snowflake, CreditCard, RefreshCw, Copy,
  Plus, X, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getSubjectLabel } from '../../utils/subjects';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

function getMonthStr(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
}

function parseMonth(str) {
  const [y, m] = str.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [monthOffset, setMonthOffset] = useState(0);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentLang, setNewStudentLang] = useState('uz');
  const [newCreds, setNewCreds] = useState(null);

  const month = getMonthStr(monthOffset);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => r.data.data),
  });

  const { data: payments, isLoading: payLoading } = useQuery({
    queryKey: ['group-payments', id, month],
    queryFn: () => api.get(`/payments/group/${id}?month=${month}`).then(r => r.data.data),
    enabled: !!id,
  });

  const freezeMutation = useMutation({
    mutationFn: (studentId) => api.patch(`/users/${studentId}/freeze`),
    onSuccess: (res, studentId) => {
      const frozen = res.data.data.isFrozen;
      toast.success(frozen ? '❄️ Student muzlatildi' : '✅ Student faollashtirildi');
      qc.invalidateQueries(['group', id]);
    },
    onError: () => toast.error('Xato yuz berdi'),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ studentId, isPaid }) => api.post('/payments', { studentId, month, isPaid }),
    onSuccess: () => {
      qc.invalidateQueries(['group-payments', id, month]);
    },
    onError: () => toast.error('Xato yuz berdi'),
  });

  const removePaymentMutation = useMutation({
    mutationFn: (studentId) => api.delete(`/payments/${studentId}/${month}`),
    onSuccess: () => {
      qc.invalidateQueries(['group-payments', id, month]);
    },
  });

  const resetPwMutation = useMutation({
    mutationFn: (studentId) => api.post(`/users/${studentId}/reset-password`),
    onSuccess: ({ data }) => toast.success(`Yangi parol: ${data.data.newPassword}`, { duration: 8000 }),
  });

  const createStudentMutation = useMutation({
    mutationFn: (d) => api.post('/users/create-student', d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries(['group', id]);
      setNewCreds(data.data.credentials);
      setNewStudentName('');
      setNewStudentPhone('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Nusxalandi!"); };

  const paymentMap = {};
  (payments || []).forEach(p => { paymentMap[p.id] = p; });

  const students = group?.students || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/teacher/groups')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-2xl">
            {group?.icon || '📚'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{group?.name}</h1>
            <span className={`badge text-xs ${group?.subject === 'biology' ? 'bg-green-100 text-green-700' : group?.subject === 'chemistry' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {getSubjectLabel(group?.subject)}
            </span>
          </div>
        </div>
        <button onClick={() => setShowAddStudent(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> O'quvchi qo'shish
        </button>
      </div>

      {/* Payment month selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary" />
            <span className="font-semibold text-gray-800 dark:text-white">Oylik to'lov</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset(o => o - 1)} className="btn-ghost p-1.5 rounded-lg">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {parseMonth(month)}
            </span>
            <button onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0} className="btn-ghost p-1.5 rounded-lg disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {payments && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-600">{payments.filter(p => p.isPaid).length}</div>
              <div className="text-xs text-green-600">To'lagan</div>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-500">{payments.filter(p => !p.isPaid).length}</div>
              <div className="text-xs text-red-500">To'lamagan</div>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-gray-600">{students.length}</div>
              <div className="text-xs text-gray-500">Jami</div>
            </div>
          </div>
        )}

        {/* Student payment list */}
        <div className="space-y-2">
          {(payments || students.map(s => ({ ...s, isPaid: false }))).map((p) => (
            <motion.div key={p.id} layout
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              {/* Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0
                ${p.isFrozen ? 'bg-blue-400' : 'gradient-bg'}`}>
                {p.isFrozen ? '❄️' : p.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 dark:text-white truncate">
                  {p.name} {p.isFrozen && <span className="text-xs text-blue-400">❄ muzlatilgan</span>}
                </div>
                <div className="text-xs text-gray-400">@{p.username}</div>
              </div>
              {/* Payment toggle */}
              <button
                onClick={() => paymentMutation.mutate({ studentId: p.id, isPaid: !p.isPaid })}
                disabled={paymentMutation.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${p.isPaid
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                {p.isPaid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {p.isPaid ? "To'landi" : "To'lanmadi"}
              </button>
            </motion.div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              Hali o'quvchilar yo'q
            </div>
          )}
        </div>
      </div>

      {/* Student list with freeze/actions */}
      <div className="card">
        <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Users size={17} className="text-primary" />
          O'quvchilar ro'yxati
          <span className="badge bg-primary/10 text-primary ml-1">{students.length}</span>
        </h2>

        <div className="space-y-2">
          {students.map((s, i) => (
            <motion.div key={s._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                ${s.isFrozen
                  ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                ${s.isFrozen ? 'bg-blue-400' : 'gradient-bg'}`}>
                {s.isFrozen ? '❄️' : s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                <div className="text-xs text-gray-400">
                  @{s.username} • Lv.{s.level} • {s.xp} XP
                  {s.phone && <span className="ml-1">• 📞 {s.phone}</span>}
                </div>
              </div>
              {s.isFrozen && (
                <span className="badge bg-blue-100 text-blue-600 text-xs">❄ Muzlatilgan</span>
              )}
              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => freezeMutation.mutate(s._id)}
                  disabled={freezeMutation.isPending}
                  title={s.isFrozen ? 'Faollashtirish' : 'Muzlatish'}
                  className={`p-2 rounded-lg transition-all text-xs
                    ${s.isFrozen
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-gray-700'}`}>
                  <Snowflake size={14} />
                </button>
                <button
                  onClick={() => { if (window.confirm('Parolni yangilash?')) resetPwMutation.mutate(s._id); }}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all"
                  title="Parolni yangilash">
                  <RefreshCw size={14} />
                </button>
              </div>
            </motion.div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali o'quvchilar yo'q. Birinchi o'quvchini qo'shing!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add student modal */}
      <AnimatePresence>
        {showAddStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAddStudent(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">O'quvchi qo'shish</h2>
                <button onClick={() => { setShowAddStudent(false); setNewCreds(null); }} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
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
                    <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)}
                      placeholder="O'quvchi ismi" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Telefon raqami</label>
                    <input value={newStudentPhone} onChange={e => setNewStudentPhone(e.target.value)}
                      placeholder="+998 90 123 45 67" type="tel" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Til</label>
                    <select value={newStudentLang} onChange={e => setNewStudentLang(e.target.value)} className="input-field">
                      <option value="uz">O'zbek</option>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAddStudent(false)} className="btn-ghost flex-1">Bekor</button>
                    <button
                      onClick={() => newStudentName && createStudentMutation.mutate({ name: newStudentName, groupId: id, language: newStudentLang, phone: newStudentPhone || undefined })}
                      disabled={!newStudentName || createStudentMutation.isPending}
                      className="btn-primary flex-1 disabled:opacity-40">
                      {createStudentMutation.isPending ? 'Qo\'shilmoqda...' : 'Qo\'shish'}
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
