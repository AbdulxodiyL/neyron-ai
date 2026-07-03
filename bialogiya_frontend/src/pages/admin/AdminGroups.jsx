import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen } from 'lucide-react';
import api from '../../config/axios';
import { getSubjectLabel } from '../../utils/subjects';

export default function AdminGroups() {
  const { data: groups } = useQuery({ queryKey: ['all-groups'], queryFn: () => api.get('/admin/groups').then(r => r.data.data) });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">All Groups ({groups?.length || 0})</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups?.map((g, i) => (
          <motion.div key={g._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card hover:shadow-soft transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center text-2xl">{g.icon || '📚'}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 dark:text-white truncate">{g.name}</h3>
                <span className={`badge text-xs ${g.subject === 'biology' ? 'bg-green-100 text-green-700' : g.subject === 'chemistry' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {getSubjectLabel(g.subject)}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><Users size={12} /> {g.students?.length || 0} students</div>
              <div className="flex items-center gap-1.5"><BookOpen size={12} /> Teacher: {g.teacher?.name || 'Unassigned'}</div>
            </div>
          </motion.div>
        ))}
        {groups?.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>No groups created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
