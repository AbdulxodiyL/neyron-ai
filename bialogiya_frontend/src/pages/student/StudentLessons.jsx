import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Brain, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import { formatDate } from '../../utils/format';

export default function StudentLessons() {
  const { user } = useAuthStore();
  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', user?.groupId],
    queryFn: () => api.get(`/lessons/group/${user?.groupId}`).then(r => r.data.data),
    enabled: !!user?.groupId,
  });

  if (!user?.groupId) return (
    <div className="text-center py-20">
      <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
      <h2 className="text-xl font-bold text-gray-500">No Group Assigned</h2>
      <p className="text-gray-400 mt-1">Ask your teacher to add you to a group.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Lessons</h1>
          <p className="text-gray-500 text-sm mt-0.5">{lessons?.length || 0} lessons available</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {lessons?.map((lesson, i) => (
            <motion.div key={lesson._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/student/lessons/${lesson._id}`}
                className="card flex items-center gap-4 hover:shadow-glow hover:border-primary/20 transition-all group">
                <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {lesson.subject === 'biology' ? '🧬' : '⚗️'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-white truncate">{lesson.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`badge text-xs ${lesson.aiContent?.status === 'done' ? 'bg-primary/10 text-primary' : lesson.aiContent?.status === 'generating' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {lesson.aiContent?.status === 'done' ? '🤖 AI Ready' : lesson.aiContent?.status === 'generating' ? '⏳ Generating' : '• Pending'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11} /> {formatDate(lesson.createdAt)}</span>
                    <span className="text-xs text-gray-400">{lesson.views} views</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
          {lessons?.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
              <p>No lessons yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
