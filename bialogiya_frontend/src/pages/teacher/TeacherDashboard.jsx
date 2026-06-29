import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, FileText, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: lessons } = useQuery({ queryKey: ['my-lessons'], queryFn: () => api.get('/lessons/my').then(r => r.data.data) });
  const { data: tests } = useQuery({ queryKey: ['my-tests'], queryFn: () => api.get('/tests/my').then(r => r.data.data) });
  const { data: homework } = useQuery({ queryKey: ['my-homework'], queryFn: () => api.get('/homework/my').then(r => r.data.data) });

  const totalStudents = groups?.reduce((sum, g) => sum + (g.students?.length || 0), 0) || 0;
  const aiReadyLessons = lessons?.filter(l => l.aiContent?.status === 'done').length || 0;

  const stats = [
    { icon: Users, label: 'Total Students', value: totalStudents, color: 'text-primary', bg: 'bg-primary/10', link: '/teacher/students' },
    { icon: BookOpen, label: 'Lessons', value: lessons?.length || 0, color: 'text-secondary', bg: 'bg-secondary/10', link: '/teacher/lessons' },
    { icon: ClipboardList, label: 'Homework', value: homework?.length || 0, color: 'text-green-500', bg: 'bg-green-50', link: '/teacher/homework' },
    { icon: FileText, label: 'Tests', value: tests?.length || 0, color: 'text-purple-500', bg: 'bg-purple-50', link: '/teacher/tests' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="gradient-bg rounded-3xl p-6 text-white">
        <h1 className="text-2xl font-black">Welcome back, {user?.name}! 👋</h1>
        <p className="text-white/70 text-sm mt-1">Here's an overview of your classes today</p>
        <div className="flex gap-3 mt-4">
          <Link to="/teacher/lessons/create" className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
            <Plus size={14} /> New Lesson
          </Link>
          <Link to="/teacher/groups" className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
            <Users size={14} /> Manage Groups
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, bg, link }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={link} className="card flex items-center gap-3 hover:shadow-glow hover:border-primary/20 transition-all group">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Groups overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><Users size={16} className="text-primary" /> My Groups</h3>
            <Link to="/teacher/groups" className="text-xs text-primary hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {groups?.slice(0, 4).map(g => (
              <div key={g._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center text-lg">{g.icon || '📚'}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-xs text-gray-400">{g.students?.length || 0} students</div>
                </div>
                <span className={`badge text-xs ${g.subject === 'biology' ? 'bg-green-100 text-green-700' : g.subject === 'chemistry' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {g.subject}
                </span>
              </div>
            ))}
            {groups?.length === 0 && <div className="text-sm text-gray-400 text-center py-4">No groups yet. <Link to="/teacher/groups" className="text-primary hover:underline">Create one</Link></div>}
          </div>
        </div>

        {/* AI Lessons status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><BookOpen size={16} className="text-secondary" /> Lessons (AI Status)</h3>
            <Link to="/teacher/lessons" className="text-xs text-primary hover:underline">All lessons →</Link>
          </div>
          <div className="space-y-2">
            {lessons?.slice(0, 5).map(l => (
              <div key={l._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.aiContent?.status === 'done' ? '#00BFA6' : l.aiContent?.status === 'generating' ? '#FCD34D' : '#CBD5E1' }} />
                <span className="text-sm flex-1 truncate">{l.title}</span>
                <span className={`badge text-xs ${l.aiContent?.status === 'done' ? 'bg-primary/10 text-primary' : l.aiContent?.status === 'generating' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {l.aiContent?.status}
                </span>
              </div>
            ))}
            {!lessons?.length && <div className="text-sm text-gray-400 text-center py-4">No lessons yet.</div>}
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" /> {aiReadyLessons} of {lessons?.length || 0} lessons have AI content
          </div>
        </div>
      </div>
    </div>
  );
}
