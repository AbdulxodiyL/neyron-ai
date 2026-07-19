import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle2, XCircle, Users, Download, Loader2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { friendlyAiErrorMessage } from '../../utils/aiErrors';

const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  const names = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  return `${names[parseInt(mo, 10) - 1]} ${y}`;
};

const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0) + " so'm";

export default function ReceptionPayments() {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: groups } = useQuery({
    queryKey: ['reception-groups'],
    queryFn: () => api.get('/reception/groups').then(r => r.data.data),
  });

  useEffect(() => {
    if (!groupId && groups?.length) setGroupId(groups[0].id);
  }, [groups, groupId]);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['reception-payments', groupId, month],
    queryFn: () => api.get(`/payments/group/${groupId}?month=${month}`).then(r => r.data.data),
    enabled: !!groupId,
  });
  const students = paymentsData?.students;
  const monthlyFee = paymentsData?.monthlyFee || 0;

  const paymentMutation = useMutation({
    mutationFn: ({ studentId, isPaid }) => api.post('/payments', { studentId, month, isPaid }),
    onSuccess: () => qc.invalidateQueries(['reception-payments', groupId, month]),
  });

  const paidCount = students?.filter(s => s.isPaid).length || 0;
  const unpaidCount = (students?.length || 0) - paidCount;
  const collected = paidCount * monthlyFee;
  const expected = (students?.length || 0) * monthlyFee;

  const [exporting, setExporting] = useState(false);
  const exportExcel = async () => {
    if (!groupId) return;
    setExporting(true);
    try {
      const res = await api.get(`/payments/group/${groupId}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${groups?.find(g => g.id === groupId)?.name || 'guruh'}-tolovlar.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(friendlyAiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">To'lovlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kirim-chiqim: kim to'lagan, kim to'lamagan</p>
        </div>
        <button onClick={exportExcel} disabled={!groupId || exporting} className="btn-outline flex items-center gap-2 disabled:opacity-40">
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          Excel yuklab olish
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className="input-field flex-1">
          {groups?.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g._count?.students || 0} o'quvchi)</option>
          ))}
        </select>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field sm:w-48" />
      </div>

      {students && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="card text-center py-3">
              <div className="text-xl font-bold text-green-600">{paidCount}</div>
              <div className="text-xs text-gray-400">To'lagan</div>
            </div>
            <div className="card text-center py-3">
              <div className="text-xl font-bold text-red-500">{unpaidCount}</div>
              <div className="text-xs text-gray-400">To'lamagan</div>
            </div>
          </div>
          {monthlyFee > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="card text-center py-3">
                <div className="text-base font-bold text-primary">{formatMoney(collected)}</div>
                <div className="text-xs text-gray-400">Yig'ilgan (kirim)</div>
              </div>
              <div className="card text-center py-3">
                <div className="text-base font-bold text-gray-400">{formatMoney(expected)}</div>
                <div className="text-xs text-gray-400">Kutilgan jami</div>
              </div>
            </div>
          )}
          {monthlyFee === 0 && (
            <p className="text-xs text-amber-500 mb-5 text-center">
              Bu guruh uchun oylik to'lov summasi belgilanmagan — daromad hisoblanmaydi.
            </p>
          )}
        </>
      )}

      <div className="text-xs text-gray-400 mb-2">{monthLabel(month)}</div>

      <div className="space-y-2">
        {isLoading && <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>}
        {students?.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="card flex items-center gap-3">
            <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {s.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
              <div className="text-xs text-gray-400">@{s.username}</div>
            </div>
            <button
              onClick={() => paymentMutation.mutate({ studentId: s.id, isPaid: !s.isPaid })}
              disabled={paymentMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                s.isPaid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              {s.isPaid ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {s.isPaid ? "To'langan" : "To'lanmagan"}
            </button>
          </motion.div>
        ))}
        {students?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>Bu guruhda o'quvchi yo'q.</p>
          </div>
        )}
        {!groupId && !isLoading && (
          <div className="text-center py-16 text-gray-400">
            <Wallet size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali guruhlar mavjud emas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
