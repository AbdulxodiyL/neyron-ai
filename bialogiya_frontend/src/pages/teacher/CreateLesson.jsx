import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Brain, Sparkles } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function CreateLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', subject: 'biology', groupId: '', order: 0 });
  const [files, setFiles] = useState([]);

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: lesson } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`).then(r => r.data.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (lesson) {
      setForm({
        title: lesson.title || '',
        content: lesson.content || '',
        subject: lesson.subject || 'biology',
        groupId: lesson.groupId || '',
        order: lesson.order || 0,
      });
    }
  }, [lesson]);

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/lessons', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Lesson created! AI is generating content...'); navigate('/teacher/lessons'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error creating lesson'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put(`/lessons/${id}`, payload),
    onSuccess: () => { toast.success('Lesson updated successfully'); navigate('/teacher/lessons'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error updating lesson'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.groupId) return toast.error('Title and Group are required');
    const submitting = id ? updateMutation : createMutation;

    if (id) {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('subject', form.subject);
      fd.append('order', form.order);
      fd.append('groupId', form.groupId);
      files.forEach(f => fd.append('files', f));
      updateMutation.mutate(fd);
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach(f => fd.append('files', f));
    createMutation.mutate(fd);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">{id ? 'Edit Lesson' : 'Create New Lesson'}</h1>
          <p className="text-sm text-gray-500">AI will automatically generate explanations, quizzes & more</p>
        </div>
      </div>

      {/* AI feature banner */}
      <div className="gradient-bg rounded-2xl p-4 mb-5 text-white flex items-center gap-3">
        <Brain size={24} className="flex-shrink-0" />
        <div>
          <div className="font-semibold text-sm">AI Teacher Auto-Generation</div>
          <div className="text-white/70 text-xs">After upload, AI will generate: Simple explanation, Memory tricks, Story mode, Quizzes, Flashcards, Summary & Mind map</div>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Lesson Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Protein Synthesis, Cell Division..." className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Subject *</label>
            <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-field">
              <option value="biology">🧬 Biology</option>
              <option value="chemistry">⚗️ Chemistry</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Group *</label>
            <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
              <option value="">Select group</option>
              {groups?.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Lesson Content</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Paste your lesson text here. The more detailed the content, the better the AI will explain it..."
            rows={8} className="input-field resize-none" />
          <p className="text-xs text-gray-400 mt-1">Tip: Paste your lesson text above — AI will learn from this content</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Attachments (PDF, Images, etc.)</label>
          <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-500">Upload supplementary files</span>
            <input type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">{f.name}</div>)}
            </div>
          )}
        </div>
        <button onClick={handleSubmit} disabled={id ? updateMutation.isPending : createMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3">
          {(id ? updateMutation.isPending : createMutation.isPending) ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> {id ? 'Saving...' : 'Creating...'}</>
          ) : (
            <><Sparkles size={16} /> {id ? 'Save Lesson' : 'Create Lesson & Generate AI Content'}</>
          )}
        </button>
      </div>
    </div>
  );
}
