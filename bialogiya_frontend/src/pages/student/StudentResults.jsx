import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../config/axios';
import { formatDate, getScoreBg } from '../../utils/format';

export default function StudentResults() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => api.get('/tests/my-results').then(r => r.data.data),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Results</h1>
      <div className="space-y-4">
        {results?.map((result, i) => (
          <motion.div key={result._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{result.testId?.title || 'Test'}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(result.completedAt)} • {Math.round(result.timeTaken / 60)} min</p>
              </div>
              <div className={`text-2xl font-black px-3 py-1 rounded-xl ${getScoreBg(result.percentage)}`}>
                {result.percentage}%
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {result.passed ? (
                <span className="badge bg-green-100 text-green-700"><CheckCircle size={12} /> Passed</span>
              ) : (
                <span className="badge bg-red-100 text-red-600">Failed</span>
              )}
              <span className="badge bg-gray-100 text-gray-600">{result.score} pts</span>
            </div>
            {result.aiAnalysis?.weakTopics?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mt-2">
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1.5">
                  <AlertTriangle size={12} /> AI Recommendations
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.aiAnalysis.weakTopics.map((t, i) => (
                    <span key={i} className="badge bg-amber-100 text-amber-700 text-xs">Review: {t}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {!isLoading && results?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 size={36} className="mx-auto mb-3 opacity-30" />
            <p>No test results yet. Take your first test!</p>
          </div>
        )}
      </div>
    </div>
  );
}
