import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, Users, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../config/axios';

export default function TeacherAnalytics() {
  const [groupId, setGroupId] = useState('');
  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: analytics } = useQuery({
    queryKey: ['group-analytics', groupId],
    queryFn: () => api.get(`/analytics/group/${groupId || 'all'}`).then(r => r.data.data),
    enabled: true,
  });

  const leaderboard = analytics?.leaderboard || [];
  const scoreChart = analytics?.scoreHistory || [];
  const topicStats = analytics?.topicStats || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Analytics</h1>
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className="input-field w-auto">
          <option value="">All groups</option>
          {groups?.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Students', value: analytics?.totalStudents || 0, color: 'text-primary', bg: 'bg-primary/10' },
          { icon: TrendingUp, label: 'Avg Score', value: `${analytics?.avgScore || 0}%`, color: 'text-secondary', bg: 'bg-secondary/10' },
          { icon: BarChart2, label: 'HW Rate', value: `${analytics?.homeworkRate || 0}%`, color: 'text-green-500', bg: 'bg-green-50' },
          { icon: Award, label: 'Attendance', value: `${analytics?.attendanceRate || 0}%`, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score history chart */}
        {scoreChart.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm flex items-center gap-2"><TrendingUp size={15} className="text-primary" /> Score Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                <Line type="monotone" dataKey="avg" stroke="#00BFA6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Leaderboard */}
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3 text-sm flex items-center gap-2"><Award size={15} className="text-yellow-500" /> Top Students</h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((s, i) => (
              <div key={s._id} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center font-bold text-gray-400">{i + 1}</span>
                <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold">{s.name?.charAt(0)}</div>
                <span className="flex-1 text-sm truncate">{s.name}</span>
                <span className="text-xs font-semibold text-primary">{s.xp} XP</span>
              </div>
            ))}
            {leaderboard.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No data yet</div>}
          </div>
        </div>
      </div>

      {/* Topic performance */}
      {topicStats.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-sm flex items-center gap-2"><BarChart2 size={15} className="text-secondary" /> Topic Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topicStats}>
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              <Bar dataKey="avgScore" fill="#00BFA6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
