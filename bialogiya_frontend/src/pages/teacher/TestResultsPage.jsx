import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../config/axios';
import { getScoreColor } from '../../utils/format';

export default function TestResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: test } = useQuery({ queryKey: ['test', id], queryFn: () => api.get(`/tests/${id}`).then(r => r.data.data) });
  const { data: results, isLoading } = useQuery({ queryKey: ['test-results', id], queryFn: () => api.get(`/tests/${id}/results`).then(r => r.data.data) });

  const chartData = results?.map(r => ({ name: r.student?.name?.split(' ')[0], score: r.percentage })) || [];
  const avgScore = results?.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  const passed = results?.filter(r => r.passed).length || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{test?.title}</h1>
          <p className="text-sm text-gray-500">Test Results Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Participants', value: results?.length || 0, color: 'text-gray-800' },
          { label: 'Average Score', value: `${avgScore}%`, color: avgScore >= 70 ? 'text-green-600' : 'text-red-500' },
          { label: 'Passed', value: `${passed}/${results?.length || 0}`, color: 'text-primary' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-primary" /> Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.score >= 70 ? '#00BFA6' : entry.score >= 50 ? '#FCD34D' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-3">
        {results?.map((r, i) => (
          <motion.div key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="card flex items-center gap-3">
            <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {r.student?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.student?.name}</div>
              {r.aiAnalysis?.weakTopics?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                  <AlertTriangle size={11} /> Weak: {r.aiAnalysis.weakTopics.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`font-bold text-sm ${getScoreColor(r.percentage)}`}>{r.percentage}%</div>
              <div className="text-xs text-gray-400">{r.score} pts</div>
            </div>
            <span className={`badge text-xs ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {r.passed ? 'Pass' : 'Fail'}
            </span>
          </motion.div>
        ))}
        {!isLoading && results?.length === 0 && (
          <div className="text-center py-12 text-gray-400">No results yet — no students have taken this test</div>
        )}
      </div>
    </div>
  );
}
