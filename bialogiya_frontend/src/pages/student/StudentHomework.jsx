import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';

export default function StudentHomework() {
  const { data: homework, isLoading } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => r.data.data),
  });

  const pending = homework?.filter(h => !h.mySubmission) || [];
  const submitted = homework?.filter(h => h.mySubmission) || [];

  const HWCard = ({ hw, i }) => {
    const isLate = new Date() > new Date(hw.dueDate) && !hw.mySubmission;
    const sub = hw.mySubmission;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
        className="card flex items-center gap-4 hover:shadow-soft transition-all">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${sub ? 'bg-green-50' : isLate ? 'bg-red-50' : 'bg-primary/10'}`}>
          {sub ? <CheckCircle size={20} className="text-green-500" /> : isLate ? <AlertCircle size={20} className="text-red-500" /> : <ClipboardList size={20} className="text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 dark:text-white truncate">{hw.title}</div>
          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
            <Clock size={11} /> Due: {formatDate(hw.dueDate)}
            {sub?.finalScore !== null && sub?.finalScore !== undefined && (
              <span className="badge bg-primary/10 text-primary ml-1">{sub.finalScore}/{hw.maxScore}</span>
            )}
            {isLate && <span className="badge bg-red-100 text-red-600">Late</span>}
          </div>
        </div>
        {!sub ? (
          <Link to={`/student/homework/${hw._id}/submit`} className="btn-primary text-xs py-2 px-3 flex-shrink-0">Submit</Link>
        ) : (
          <span className="badge bg-green-100 text-green-700 text-xs">Submitted</span>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Homework</h1>
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3">{pending.map((hw, i) => <HWCard key={hw._id} hw={hw} i={i} />)}</div>
        </div>
      )}
      {submitted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Submitted ({submitted.length})</h2>
          <div className="space-y-3">{submitted.map((hw, i) => <HWCard key={hw._id} hw={hw} i={i} />)}</div>
        </div>
      )}
      {!isLoading && homework?.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={36} className="mx-auto mb-3 opacity-30" />
          <p>No homework assigned yet</p>
        </div>
      )}
    </div>
  );
}
