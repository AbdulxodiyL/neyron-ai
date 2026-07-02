import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Clock, CheckCircle, Pencil, Trash2, X, Save } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

export default function ManageHomework() {
  const qc = useQueryClient();
  const [editingHw, setEditingHw] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: homework, isLoading } = useQuery({
    queryKey: ['my-homework'],
    queryFn: () => api.get('/homework/my').then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/homework/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-homework']); toast.success('Vazifa o\'chirildi'); },
    onError: () => toast.error('Xato yuz berdi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/homework/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries(['my-homework']);
      toast.success('Vazifa yangilandi');
      setEditingHw(null);
    },
    onError: () => toast.error('Xato yuz berdi'),
  });

  const openEdit = (hw) => {
    setEditingHw(hw._id);
    setEditForm({
      title: hw.title,
      description: hw.description || '',
      dueDate: hw.dueDate ? hw.dueDate.slice(0, 16) : '',
      maxScore: hw.maxScore || 100,
    });
  };

  const handleUpdate = () => {
    if (!editForm.title || !editForm.dueDate) return toast.error('Sarlavha va muddatni to\'ldiring');
    updateMutation.mutate({ id: editingHw, data: editForm });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Uy vazifalari</h1>
        <Link to="/teacher/homework/create" className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Yangi vazifa
        </Link>
      </div>

      <div className="space-y-3">
        {homework?.map((hw, i) => {
          const isPast = new Date(hw.dueDate) < new Date();
          const submissionCount = hw._count?.submissions || 0;
          const isEditing = editingHw === hw._id;

          return (
            <motion.div key={hw._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="card">
              {isEditing ? (
                /* Edit form inline */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-primary">Tahrirlash</span>
                    <button onClick={() => setEditingHw(null)} className="btn-ghost p-1.5 rounded-lg"><X size={14} /></button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Sarlavha *</label>
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-500">Tavsif</label>
                    <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      className="input-field text-sm resize-none" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Muddat *</label>
                      <input type="datetime-local" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                        className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-500">Maksimal ball</label>
                      <input type="number" value={editForm.maxScore} onChange={e => setEditForm(f => ({ ...f, maxScore: e.target.value }))}
                        className="input-field text-sm" min={1} max={200} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingHw(null)} className="btn-ghost flex-1 text-sm">Bekor</button>
                    <button onClick={handleUpdate} disabled={updateMutation.isPending}
                      className="btn-primary flex-1 text-sm flex items-center justify-center gap-1.5 disabled:opacity-40">
                      <Save size={13} />
                      {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal view */
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-gray-100' : 'bg-primary/10'}`}>
                    <ClipboardList size={18} className={isPast ? 'text-gray-400' : 'text-primary'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-white">{hw.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                      <span>{hw.group?.name}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDate(hw.dueDate)}
                      </span>
                      <span>Max: {hw.maxScore} ball</span>
                      {isPast && <span className="badge bg-gray-100 text-gray-500">Tugagan</span>}
                    </div>
                    {submissionCount > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                        </div>
                        <span>{submissionCount} ta topshirilgan</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/teacher/homework/${hw._id}/submissions`}
                      className="btn-ghost p-1.5 rounded-lg text-secondary" title="Topshiriqlarni ko'rish">
                      <CheckCircle size={15} />
                    </Link>
                    <button onClick={() => openEdit(hw)}
                      className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10" title="Tahrirlash">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Vazifani o\'chirishni tasdiqlaysizmi?')) deleteMutation.mutate(hw._id); }}
                      className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="O'chirish">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {!isLoading && homework?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
            <p>Hali uy vazifasi yo'q. <Link to="/teacher/homework/create" className="text-primary hover:underline">Birinchisini yarating</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
