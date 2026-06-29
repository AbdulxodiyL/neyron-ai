import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';

export default function StudentAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-analytics-full'],
    queryFn: () => api.get('/analytics/student').then(r => r.data.data),
  });

  const chartData = data?.scoreHistory?.map(r => ({
    name: formatDate(r.date).split(' ').slice(0, 2).join(' '),
    score: r.score,
  })) || [];

  const stats = data?.stats || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Score', value: `${stats.avgScore || 0}%`, color: 'text-primary' },
          { label: 'HW Done', value: `${stats.homeworkCompleted || 0}/${stats.totalHomework || 0}`, color: 'text-secondary' },
          { label: 'Attendance', value: `${stats.attendanceRate || 100}%`, color: 'text-green-500' },
          { label: 'Tests Taken', value: data?.recentResults?.length || 0, color: 'text-purple-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Score History
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="score" stroke="#00BFA6" strokeWidth={2.5}
                dot={{ fill: '#00BFA6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Take tests to see your score history</div>
        )}
      </div>

      {(data?.weakTopics?.length > 0 || data?.strongTopics?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Weak Topics</h3>
            <div className="space-y-2">
              {data.weakTopics?.map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-xl text-sm text-red-700">⚠️ {t}</div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Strong Topics</h3>
            <div className="space-y-2">
              {data.strongTopics?.map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-xl text-sm text-green-700">✅ {t}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
