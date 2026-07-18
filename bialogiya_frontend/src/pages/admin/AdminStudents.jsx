import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, GraduationCap } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { getLevelProgress } from '../../utils/format';

export default function AdminStudents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: students } = useQuery({ queryKey: ['all-students'], queryFn: () => api.get('/admin/students').then(r => r.data.data) });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle`),
    onSuccess: () => { qc.invalidateQueries(['all-students']); toast.success('Status updated'); },
  });

  const filtered = students?.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Students ({students?.length || 0})</h1>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          className="input-field pl-10" />
      </div>

      <div className="space-y-2">
        {filtered.map((s, i) => {
          const { level } = getLevelProgress(s.xp);
          return (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="card flex items-center gap-3">
              <div className="w-9 h-9 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">{s.name?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-gray-400">@{s.username} • {s.group?.name || 'No group'} • Teacher: {s.teacher?.name || '-'}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                <span className="badge bg-primary/10 text-primary">Lv.{level}</span>
                <span>{s.xp} XP</span>
              </div>
              <button onClick={() => toggleMutation.mutate(s.id)}
                className={`badge text-xs cursor-pointer flex-shrink-0 ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </button>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>{search ? 'No students match your search' : 'No students yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
