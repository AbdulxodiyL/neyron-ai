import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, Trash2, BarChart2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

const TYPE_COLORS = { topic: 'bg-blue-100 text-blue-700', weekly: 'bg-green-100 text-green-700', monthly: 'bg-purple-100 text-purple-700', mock: 'bg-orange-100 text-orange-700' };

export default function ManageTests() {
  const qc = useQueryClient();
  const { data: tests, isLoading } = useQuery({ queryKey: ['my-tests'], queryFn: () => api.get('/tests').then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tests/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-tests']); toast.success('Test deleted'); },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tests</h1>
        <Link to="/teacher/tests/create" className="btn-primary flex items-center gap-2"><Plus size={15} /> Create Test</Link>
      </div>
      <div className="space-y-3">
        {tests?.map((t, i) => (
          <motion.div key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 dark:text-white">{t.title}</div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                <span className={`badge ${TYPE_COLORS[t.type] || 'bg-gray-100 text-gray-600'}`}>{t.type}</span>
                <span>{t.group?.name}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {t.timeLimit} min</span>
                <span>{t._count?.questions || 0} questions</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link to={`/teacher/tests/${t._id}/results`} className="btn-ghost p-1.5 rounded-lg text-secondary"><BarChart2 size={15} /></Link>
              <button onClick={() => { if (window.confirm('Delete test?')) deleteMutation.mutate(t._id); }}
                className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
        {!isLoading && tests?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>No tests yet. <Link to="/teacher/tests/create" className="text-primary hover:underline">Create the first test</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
