import { useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
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
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const month = getMonthStr(monthOffset);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then(r => r.data.data),
  });

  const { data: paymentsData, isLoading: payLoading } = useQuery({
    queryKey: ['group-payments', id, month],
    queryFn: () => api.get(`/payments/group/${id}?month=${month}`).then(r => r.data.data),
    enabled: !!id,
  });
  const payments = paymentsData?.students;

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

        <div className="text-sm text-gray-500">
          O'quvchini pastdan tanlang — u yerda oylik to'lov, muzlatish va parolni reset qilish bir joyda ko'rinadi.
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
          {students.map((s, i) => {
            const payment = paymentMap[s._id] || {};
            const isPaid = payment.isPaid;
            const paidAt = payment.payment?.paidAt ? new Date(payment.payment.paidAt).toLocaleDateString() : null;
            const isSelected = selectedStudentId === s._id;
            return (
              <motion.div key={s._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`rounded-xl border transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                <button type="button" onClick={() => setSelectedStudentId(isSelected ? null : s._id)}
                  className="w-full text-left p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0
                    ${s.isFrozen ? 'bg-blue-400' : 'gradient-bg'}`}>
                    {s.isFrozen ? '❄️' : s.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-2">
                      <span>@{s.username}</span>
                      <span>Lv.{s.level}</span>
                      <span>{s.xp} XP</span>
                      {s.phone && <span>📞 {s.phone}</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                      <span className={`px-2 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isPaid ? "To'landi" : "To'lanmadi"}
                      </span>
                      {paidAt && <span className="text-gray-400">Oxirgi to'lov: {paidAt}</span>}
                      {s.isFrozen && <span className="text-blue-500">Muzlatilgan</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); freezeMutation.mutate(s._id); }}
                      disabled={freezeMutation.isPending}
                      title={s.isFrozen ? 'Faollashtirish' : 'Muzlatish'}
                      className={`p-2 rounded-lg transition-all ${s.isFrozen ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-gray-700'}`}>
                      <Snowflake size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); resetPwMutation.mutate(s._id); }}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-primary/10 hover:text-primary transition-all"
                      title="Kodni restart qilish">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </button>
                {isSelected && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 rounded-b-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        onClick={() => paymentMutation.mutate({ studentId: s._id, isPaid: !isPaid })}
                        disabled={paymentMutation.isPending}
                        className={`btn-sm ${isPaid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                        {isPaid ? "To'lovni qaytarish" : "To'lovni belgilash"}
                      </button>
                      <button
                        onClick={() => removePaymentMutation.mutate(s._id)}
                        disabled={removePaymentMutation.isPending}
                        className="btn-ghost text-xs text-gray-500 hover:text-gray-700">
                        To'lovni o'chirish
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-gray-500">
                      Ushbu o'quvchiga tegishli barcha boshqaruvlar shu yerda: oylik to'lov, muzlatish va kodni restart qilish.
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali o'quvchilar yo'q. Birinchi o'quvchini qo'shing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
