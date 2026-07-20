import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Users2, GraduationCap, BookOpen, ChevronRight, Building2, Loader2 } from 'lucide-react';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';

const TABS = [
  { key: 'groups', label: 'Guruhlar', icon: Users2 },
  { key: 'students', label: "O'quvchilar", icon: GraduationCap },
  { key: 'lessons', label: 'Darslar', icon: BookOpen },
];

export default function ReceptionTeacherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isReception = user?.role === 'reception';
  const initialTab = searchParams.get('tab') || 'groups';
  const [tab, setTab] = useState(TABS.some(t => t.key === initialTab) ? initialTab : 'groups');

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-overview', id],
    queryFn: () => api.get(`/admin/teachers/${id}/overview`).then(r => r.data.data),
  });

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>;
  }

  const groups = data?.groups || [];
  const students = data?.students || [];
  const lessons = data?.lessons || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{data?.teacher?.name}</h1>
          <p className="text-sm text-gray-400">O'qituvchi ma'lumotlari</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = t.key === 'groups' ? groups.length : t.key === 'students' ? students.length : lessons.length;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? 'gradient-bg text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
              <Icon size={14} /> {t.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {tab === 'groups' && (
        <div className="space-y-2">
          {groups.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => isReception && navigate(`/reception/groups/${g.id}`)}
              className={`card flex items-center gap-3 transition-shadow ${isReception ? 'cursor-pointer hover:shadow-md' : ''}`}>
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <Users2 size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{g.name}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span>{g._count?.students || 0} o'quvchi</span>
                  {g.branch && <><span>·</span><span className="flex items-center gap-0.5"><Building2 size={10} />{g.branch.name}</span></>}
                </div>
              </div>
              {isReception && <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />}
            </motion.div>
          ))}
          {groups.length === 0 && <div className="text-center py-16 text-gray-400"><Users2 size={32} className="mx-auto mb-2 opacity-30" /><p>Guruh yo'q.</p></div>}
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-2">
          {students.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="card flex items-center gap-3">
              <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {s.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">{s.name}</div>
                <div className="text-xs text-gray-400">@{s.username} {s.group && `· ${s.group.name}`}</div>
              </div>
              <span className="text-xs text-gray-400">{s.xp || 0} XP</span>
            </motion.div>
          ))}
          {students.length === 0 && <div className="text-center py-16 text-gray-400"><GraduationCap size={32} className="mx-auto mb-2 opacity-30" /><p>O'quvchi yo'q.</p></div>}
        </div>
      )}

      {tab === 'lessons' && (
        <div className="space-y-2">
          {lessons.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="card flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{l.title}</div>
                <div className="text-xs text-gray-400">
                  {l.group?.name || "Guruhsiz"} · {new Date(l.createdAt).toLocaleDateString('uz-UZ')}
                </div>
              </div>
            </motion.div>
          ))}
          {lessons.length === 0 && <div className="text-center py-16 text-gray-400"><BookOpen size={32} className="mx-auto mb-2 opacity-30" /><p>Dars yo'q.</p></div>}
        </div>
      )}
    </div>
  );
}
