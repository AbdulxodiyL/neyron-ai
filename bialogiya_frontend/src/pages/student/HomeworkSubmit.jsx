import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Send, FileText, X } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

export default function HomeworkSubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState([]);

  const { data: hw } = useQuery({
    queryKey: ['homework', id],
    queryFn: () => api.get(`/homework/group/${id}`).then(r => r.data.data),
    enabled: false,
  });

  const submitMutation = useMutation({
    mutationFn: (formData) => api.post(`/homework/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Homework submitted!'); navigate('/student/homework'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Submission failed'),
  });

  const handleSubmit = () => {
    if (!answer.trim() && files.length === 0) return toast.error('Add an answer or upload a file');
    const fd = new FormData();
    fd.append('answerText', answer);
    files.forEach(f => fd.append('files', f));
    submitMutation.mutate(fd);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl"><ArrowLeft size={18} /></button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Submit Homework</h1>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Answer</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={8}
            className="input-field resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Files (optional)</label>
          <label className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all block">
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-500">Click to upload PDF, images, or documents</span>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden"
              onChange={e => setFiles(Array.from(e.target.files))} />
          </label>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                  <FileText size={14} className="text-primary" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={submitMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {submitMutation.isPending ? 'Submitting...' : (<><Send size={16} /> Submit Homework</>)}
        </button>
      </div>
    </div>
  );
}
