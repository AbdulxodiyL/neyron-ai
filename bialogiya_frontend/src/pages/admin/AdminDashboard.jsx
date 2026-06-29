import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, GraduationCap, UserCheck, BookOpen, BarChart2, Bot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data.data) });

  const stats = [
    { icon: Users, label: 'Total Teachers', value: data?.totalTeachers || 0, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: GraduationCap, label: 'Total Students', value: data?.totalStudents || 0, color: 'text-secondary', bg: 'bg-secondary/10' },
    { icon: BookOpen, label: 'Total Groups', value: data?.totalGroups || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Bot, label: 'AI Lessons', value: data?.aiLessons || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: BarChart2, label: 'Active Today', value: data?.activeToday || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: UserCheck, label: 'New This Week', value: data?.newThisWeek || 0, color: 'text-teal-500', bg: 'bg-teal-50' },
  ];

  const chartData = data?.dailyActivity || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="gradient-bg rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-black">Admin Panel</h1>
        <p className="text-white/70 text-sm mt-1">NEYRON AI — Platform Overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card flex items-center gap-3">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" /> Daily Active Users
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="students" stroke="#00BFA6" strokeWidth={2} name="Students" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="teachers" stroke="#0099FF" strokeWidth={2} name="Teachers" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent users */}
      {data?.recentUsers?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">Recently Joined</h3>
          <div className="space-y-2">
            {data.recentUsers.map((u, i) => (
              <div key={u._id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold">{u.name?.charAt(0)}</div>
                <div className="flex-1 text-sm">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">@{u.username}</span>
                </div>
                <span className={`badge text-xs ${u.role === 'teacher' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
