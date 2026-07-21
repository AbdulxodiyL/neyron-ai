import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Inbox, Phone, MessageSquare, Trash2, Check, X, PhoneCall } from 'lucide-react';
import api from '../../config/axios';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const STATUS_LABEL = {
  new: { label: 'Yangi', className: 'bg-blue-100 text-blue-700' },
  contacted: { label: "Bog'lanildi", className: 'bg-amber-100 text-amber-700' },
  converted: { label: "O'qishga yozildi", className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rad etildi', className: 'bg-gray-100 text-gray-500' },
};

const FILTERS = [
  { key: '', label: 'Barchasi' },
  { key: 'new', label: 'Yangi' },
  { key: 'contacted', label: "Bog'lanildi" },
  { key: 'converted', label: "O'qishga yozildi" },
  { key: 'rejected', label: 'Rad etildi' },
];

export default function AdminApplications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', filter],
    queryFn: () => api.get('/applications', { params: filter ? { status: filter } : {} }).then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/applications/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['applications']),
  });

  const deleteApp = useMutation({
    mutationFn: (id) => api.delete(`/applications/${id}`),
    onSuccess: () => qc.invalidateQueries(['applications']),
  });

  const handleDelete = (a) => {
    setConfirm({
      title: `"${a.name}" arizasini o'chirish`,
      message: "Bu ariza ro'yxatdan butunlay o'chiriladi.",
      onConfirm: () => deleteApp.mutate(a.id),
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Arizalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Landing sahifadan kelgan murojaatlar</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'gradient-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-16 text-gray-400">Yuklanmoqda...</div>}

      <div className="space-y-2">
        {applications?.map((a, i) => {
          const st = STATUS_LABEL[a.status] || STATUS_LABEL.new;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white">{a.name}</span>
                    <span className={`badge text-[11px] ${st.className}`}>{st.label}</span>
                  </div>
                  <a href={`tel:${a.phone}`} className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Phone size={11} /> {a.phone}
                  </a>
                  {a.message && (
                    <p className="text-xs text-gray-500 mt-2 flex items-start gap-1.5">
                      <MessageSquare size={12} className="flex-shrink-0 mt-0.5 text-gray-400" />
                      {a.message}
                    </p>
                  )}
                  <div className="text-[11px] text-gray-400 mt-2">
                    {new Date(a.createdAt).toLocaleString('uz-UZ')}
                  </div>
                </div>
                <button onClick={() => handleDelete(a)} className="btn-ghost p-2 rounded-lg text-red-400 hover:bg-red-50 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>

              {a.status !== 'converted' && a.status !== 'rejected' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  {a.status === 'new' && (
                    <button onClick={() => updateStatus.mutate({ id: a.id, status: 'contacted' })}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                      <PhoneCall size={12} /> Bog'lanildi deb belgilash
                    </button>
                  )}
                  <button onClick={() => updateStatus.mutate({ id: a.id, status: 'converted' })}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                    <Check size={12} /> O'qishga yozildi
                  </button>
                  <button onClick={() => updateStatus.mutate({ id: a.id, status: 'rejected' })}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 transition-colors">
                    <X size={12} /> Rad etish
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
        {applications?.length === 0 && !isLoading && (
          <div className="text-center py-16 text-gray-400">
            <Inbox size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hozircha ariza yo'q.</p>
          </div>
        )}
      </div>
    </div>
  );
}
