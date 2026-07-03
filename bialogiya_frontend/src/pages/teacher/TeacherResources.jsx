import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Upload, FileText, Image, Video, Trash2, X, Download, Loader2 } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const TYPE_ICONS = { pdf: FileText, image: Image, video: Video, other: FileText };
const TYPE_COLORS = { pdf: 'text-red-500 bg-red-50', image: 'text-blue-500 bg-blue-50', video: 'text-purple-500 bg-purple-50', other: 'text-gray-500 bg-gray-100' };

export default function TeacherResources() {
  const qc = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', groupId: '' });
  const [file, setFile] = useState(null);

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const { data: resources } = useQuery({ queryKey: ['resources'], queryFn: () => api.get('/resources').then(r => r.data.data) });

  const uploadMutation = useMutation({
    mutationFn: (fd) => api.post('/resources', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['resources']); setShowUpload(false); toast.success('Resource uploaded!'); setFile(null); setForm({ title: '', description: '', groupId: '' }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/resources/${id}`),
    onSuccess: () => { qc.invalidateQueries(['resources']); toast.success('Deleted'); },
  });

  const downloadMutation = useMutation({
    mutationFn: async (r) => {
      const res = await api.post(`/resources/${r._id}/download`, null, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = r.filePath || r.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error('Faylni yuklab bo\'lmadi'),
  });

  const handleUpload = () => {
    if (!form.title || !file) return toast.error('Title and file required');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    fd.append('file', file);
    uploadMutation.mutate(fd);
  };

  const getType = (r) => r.type || (r.filePath?.match(/\.(jpg|png|gif)/i) ? 'image' : r.filePath?.match(/\.mp4/i) ? 'video' : r.filePath?.match(/\.pdf/i) ? 'pdf' : 'other');
  const getResourceId = (r) => r._id || r.id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Resources</h1>
        <button onClick={() => setShowUpload(true)} className="btn-primary flex items-center gap-2"><Plus size={15} /> Upload</button>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Upload Resource</h2>
              <button onClick={() => setShowUpload(false)} className="btn-ghost p-1.5 rounded-lg"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Group (optional)</label>
                <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="input-field">
                  <option value="">All groups</option>
                  {groups?.map(g => <option key={g.id || g._id} value={g.id || g._id}>{g.name}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium mb-1.5">File *</label>
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary/40 block">
                  <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                  <span className="text-sm text-gray-400">{file ? file.name : 'Choose file to upload'}</span>
                  <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowUpload(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleUpload} disabled={uploadMutation.isPending} className="btn-primary flex-1">
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {resources?.map((r, i) => {
          const type = getType(r);
          const resourceId = getResourceId(r);
          const Icon = TYPE_ICONS[type] || FileText;
          const isDownloading = downloadMutation.isPending && downloadMutation.variables?._id === resourceId;
          return (
            <motion.div key={resourceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[type]}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{r.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.group?.name || 'All groups'} • {r.downloads || 0} downloads</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => downloadMutation.mutate({ _id: resourceId })} disabled={isDownloading}
                  className="btn-ghost p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50">
                  {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                </button>
                <button onClick={() => { if (window.confirm('Delete?')) deleteMutation.mutate(resourceId); }}
                  className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            </motion.div>
          );
        })}
        {resources?.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-400">
            <Upload size={36} className="mx-auto mb-3 opacity-30" />
            <p>No resources yet. Upload your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
