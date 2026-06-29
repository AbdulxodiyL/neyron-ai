import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import {
  BookOpen, ClipboardList, Trophy, Zap, Flame, Star,
  TrendingUp, Calendar, Bell, ChevronRight, Brain, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../config/axios';
import { getLevelProgress, formatDate, getScoreBg } from '../../utils/format';

const MOTIVATIONS = [
  "Har bir dars — kelajagingizga bitta qadam! 🚀",
  "Bilim — eng kuchli qurol! Davom eting! 💪",
  "Bugungi harakatingiz ertangi muvaffaqiyatingiz! ⭐",
  "Hech qachon o'rganishni to'xtatmang! 🧠",
  "Siz bunga qodirсiz! Oldinga! 🎯",
];

const StatCard = ({ icon: Icon, label, value, color, bg, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card flex items-center gap-4"
  >
    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </motion.div>
);

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();

  const { data: analytics } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: () => api.get('/analytics/student').then(r => r.data.data),
  });

  const { data: homeworkData } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/homework/student').then(r => r.data.data),
  });

  const { data: testsData } = useQuery({
    queryKey: ['student-tests'],
    queryFn: () => api.get(`/tests/group/${user?.groupId}`).then(r => r.data.data),
    enabled: !!user?.groupId,
  });

  const { level, progress } = getLevelProgress(user?.xp || 0);
  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('good_morning');
    if (h < 17) return t('good_afternoon');
    return t('good_evening');
  };

  const pendingHW = homeworkData?.filter(h => !h.mySubmission).slice(0, 3) || [];
  const upcomingTests = testsData?.slice(0, 3) || [];
  const scoreHistory = analytics?.scoreHistory || [];

  const chartData = scoreHistory.map(r => ({
    name: formatDate(r.date).split(' ').slice(0, 2).join(' '),
    score: r.score,
  })).slice(-7);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-bg rounded-3xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="text-white/80 text-sm font-medium">{getGreeting()},</div>
          <h1 className="text-2xl font-black mt-0.5">{user?.name} 👋</h1>
          <p className="text-white/70 text-sm mt-1">{motivation}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Flame size={14} /> <span>{user?.streak?.current || 0} streak</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Zap size={14} /> <span>{user?.xp || 0} XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-sm">
              <Star size={14} /> <span>{t('level')} {level}</span>
            </div>
          </div>
          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{t('level')} {level}</span>
              <span>{t('level')} {level + 1}</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label={t('avg_score')} value={`${analytics?.stats?.avgScore || 0}%`}
          color="text-primary" bg="bg-primary/10" delay={0.05} />
        <StatCard icon={ClipboardList} label={t('homework')} value={`${analytics?.stats?.homeworkCompleted || 0}/${analytics?.stats?.totalHomework || 0}`}
          color="text-secondary" bg="bg-secondary/10" delay={0.1} />
        <StatCard icon={Calendar} label={t('attendance')} value={`${analytics?.stats?.attendanceRate || 100}%`}
          color="text-green-500" bg="bg-green-50" delay={0.15} />
        <StatCard icon={Trophy} label={t('level')} value={`${level}`}
          color="text-yellow-500" bg="bg-yellow-50" delay={0.2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card lg:col-span-2"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            {t('weekly_stats')}
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="score" stroke="#00BFA6" strokeWidth={2.5}
                  dot={{ fill: '#00BFA6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              <div className="text-center">
                <Target size={32} className="mx-auto mb-2 opacity-30" />
                Complete a test to see your progress
              </div>
            </div>
          )}
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Brain size={18} className="text-secondary" />
            {t('ai_recommendations')}
          </h3>
          {analytics?.weakTopics?.length > 0 ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">{t('weak_topics')}</p>
                {analytics.weakTopics.slice(0, 3).map((topic, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl mb-1.5">
                    <span className="text-red-400 text-xs">⚠️</span>
                    <span className="text-sm text-red-700 dark:text-red-400">{topic}</span>
                  </div>
                ))}
              </div>
              {analytics.strongTopics?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">{t('strong_topics')}</p>
                  {analytics.strongTopics.slice(0, 2).map((topic, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-xl mb-1.5">
                      <span className="text-xs">✅</span>
                      <span className="text-sm text-green-700 dark:text-green-400">{topic}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain size={32} className="mx-auto mb-2 text-secondary/30" />
              <p className="text-sm text-gray-400">Complete tests to get AI recommendations</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending homework */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <ClipboardList size={18} className="text-primary" />
              {t('homework')}
            </h3>
            <Link to="/student/homework" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('view_all')} <ChevronRight size={14} />
            </Link>
          </div>
          {pendingHW.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
              No pending homework!
            </div>
          ) : pendingHW.map((hw) => (
            <Link key={hw._id} to={`/student/homework/${hw._id}/submit`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors group mb-1">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 dark:text-white truncate">{hw.title}</div>
                <div className="text-xs text-gray-400">Due: {formatDate(hw.dueDate)}</div>
              </div>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </motion.div>

        {/* Upcoming tests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Bell size={18} className="text-secondary" />
              {t('upcoming_exams')}
            </h3>
            <Link to="/student/tests" className="text-sm text-primary hover:underline flex items-center gap-1">
              {t('view_all')} <ChevronRight size={14} />
            </Link>
          </div>
          {upcomingTests.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              No upcoming tests
            </div>
          ) : upcomingTests.map(test => (
            <Link key={test._id} to={`/student/tests/${test._id}/run`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors group mb-1">
              <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
                <span className="text-xs font-bold text-secondary">{test.type?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 dark:text-white truncate">{test.title}</div>
                <div className="text-xs text-gray-400">{test.timeLimit} {t('minutes')} • {test.type}</div>
              </div>
              <span className="badge bg-secondary/10 text-secondary text-xs">{test.questions?.length || 0}Q</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
