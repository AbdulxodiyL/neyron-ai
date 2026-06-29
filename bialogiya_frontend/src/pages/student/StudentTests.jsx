import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';

export default function StudentTests() {
  const { user } = useAuthStore();
  const { data: tests, isLoading } = useQuery({
    queryKey: ['tests', user?.groupId],
    queryFn: () => api.get(`/tests/group/${user?.groupId}`).then(r => r.data.data),
    enabled: !!user?.groupId,
  });

  const { data: results } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => api.get('/tests/my-results').then(r => r.data.data),
  });

  const completedIds = new Set(results?.map(r => String(r.testId?._id || r.testId)));
  const typeColors = { topic: 'bg-primary/10 text-primary', weekly: 'bg-secondary/10 text-secondary', monthly: 'bg-purple-100 text-purple-700', mock: 'bg-yellow-100 text-yellow-700' };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tests</h1>
      <div className="space-y-3">
        {tests?.map((test, i) => {
          const done = completedIds.has(String(test._id));
          const result = results?.find(r => String(r.testId?._id || r.testId) === String(test._id));
          return (
            <motion.div key={test._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-center gap-4">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 dark:text-white truncate">{test.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge text-xs ${typeColors[test.type] || 'bg-gray-100 text-gray-600'}`}>{test.type}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {test.timeLimit} min</span>
                  {done && result && <span className="badge bg-green-100 text-green-700 text-xs">✓ {result.percentage}%</span>}
                </div>
              </div>
              {!done ? (
                <Link to={`/student/tests/${test._id}/run`} className="btn-primary text-xs py-2 px-3 flex-shrink-0">Start</Link>
              ) : (
                <span className="badge bg-gray-100 text-gray-500 text-xs">Completed</span>
              )}
            </motion.div>
          );
        })}
        {!isLoading && tests?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p>No tests available</p>
          </div>
        )}
      </div>
    </div>
  );
}
