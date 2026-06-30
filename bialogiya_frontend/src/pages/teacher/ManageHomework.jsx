import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Clock, CheckCircle } from 'lucide-react';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';

export default function ManageHomework() {
  const { data: homework, isLoading } = useQuery({ queryKey: ['my-homework'], queryFn: () => api.get('/homework/my').then(r => r.data.data) });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Homework</h1>
        <Link to="/teacher/homework/create" className="btn-primary flex items-center gap-2"><Plus size={15} /> New Homework</Link>
      </div>
      <div className="space-y-3">
        {homework?.map((hw, i) => {
          const isPast = new Date(hw.dueDate) < new Date();
          const submissionCount = hw._count?.submissions || 0;
          return (
            <motion.div key={hw._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className="card">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-gray-100' : 'bg-primary/10'}`}>
                  <ClipboardList size={18} className={isPast ? 'text-gray-400' : 'text-primary'} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white">{hw.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{hw.group?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Due: {formatDate(hw.dueDate)}
                    </span>
                    {isPast && <span className="badge bg-gray-100 text-gray-500 text-xs">Closed</span>}
                  </div>
                </div>
                <Link to={`/teacher/homework/${hw._id}/submissions`}
                  className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
                  <CheckCircle size={12} /> Grade ({submissionCount || 0})
                </Link>
              </div>
              {submissionCount > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Submissions</span>
                    <span>{submissionCount} submitted</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
        {!isLoading && homework?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
            <p>No homework yet. <Link to="/teacher/homework/create" className="text-primary hover:underline">Create the first one</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
