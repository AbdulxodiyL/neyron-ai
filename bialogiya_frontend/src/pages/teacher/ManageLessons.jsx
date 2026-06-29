import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Trash2, RefreshCw, Eye } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

export default function ManageLessons() {
  const qc = useQueryClient();
  const { data: lessons, isLoading } = useQuery({ queryKey: ['my-lessons'], queryFn: () => api.get('/lessons/my').then(r => r.data.data) });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/lessons/${id}`),
    onSuccess: () => { qc.invalidateQueries(['my-lessons']); toast.success('Lesson deleted'); },
  });

  const regenMutation = useMutation({
    mutationFn: (id) => api.post(`/lessons/${id}/regenerate-ai`),
    onSuccess: () => { qc.invalidateQueries(['my-lessons']); toast.success('AI regeneration started'); },
  });

  const STATUS = { done: '✓ AI Ready', generating: '⏳ Generating', pending: '• Pending', error: '⚠ Error' };
  const STATUS_COLOR = { done: 'bg-primary/10 text-primary', generating: 'bg-yellow-100 text-yellow-700', pending: 'bg-gray-100 text-gray-500', error: 'bg-red-100 text-red-600' };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Lessons</h1>
        <Link to="/teacher/lessons/create" className="btn-primary flex items-center gap-2"><Plus size={15} /> New Lesson</Link>
      </div>
      <div className="space-y-3">
        {lessons?.map((l, i) => (
          <motion.div key={l._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            className="card flex items-center gap-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              {l.subject === 'biology' ? '🧬' : '⚗️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 dark:text-white truncate">{l.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`badge text-xs ${STATUS_COLOR[l.aiContent?.status] || STATUS_COLOR.pending}`}>{STATUS[l.aiContent?.status] || 'Pending'}</span>
                <span className="text-xs text-gray-400">{l.groupId?.name}</span>
                <span className="text-xs text-gray-400">{l.views} views</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(l.aiContent?.status === 'error' || l.aiContent?.status === 'pending') && (
                <button onClick={() => regenMutation.mutate(l._id)} className="btn-ghost p-1.5 rounded-lg text-secondary hover:text-secondary"><RefreshCw size={14} /></button>
              )}
              <button onClick={() => { if (window.confirm('Delete this lesson?')) deleteMutation.mutate(l._id); }}
                className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </motion.div>
        ))}
        {!isLoading && lessons?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p>No lessons yet. <Link to="/teacher/lessons/create" className="text-primary hover:underline">Create your first</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
