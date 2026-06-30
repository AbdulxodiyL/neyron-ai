import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FolderOpen, Download, ExternalLink, FileText, Image, Video } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';

const TYPE_ICONS = { pdf: FileText, image: Image, video: Video, ppt: FileText, word: FileText, link: ExternalLink, other: FileText };
const TYPE_COLORS = { pdf: 'text-red-500 bg-red-50', image: 'text-blue-500 bg-blue-50', video: 'text-purple-500 bg-purple-50', ppt: 'text-orange-500 bg-orange-50', link: 'text-green-500 bg-green-50', other: 'text-gray-500 bg-gray-50' };

export default function StudentResources() {
  const { user } = useAuthStore();
  const { data: resources } = useQuery({
    queryKey: ['resources', user?.groupId],
    queryFn: () => api.get(`/resources?groupId=${user?.groupId}`).then(r => r.data.data),
    enabled: !!user?.groupId,
  });

  const trackDownload = useMutation({ mutationFn: (id) => api.post(`/resources/${id}/download`) });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Resources</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources?.map((r, i) => {
          const Icon = TYPE_ICONS[r.type] || FileText;
          const color = TYPE_COLORS[r.type] || TYPE_COLORS.other;
          const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
          const url = r.filePath ? `${backendBase}${r.filePath}` : r.fileUrl;
          return (
            <motion.div key={r._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="card hover:shadow-glow hover:border-primary/20 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2">{r.title}</h3>
              {r.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{r.description}</p>}
              <div className="flex items-center justify-between">
                <span className="badge text-xs bg-gray-100 text-gray-600">{(r.type || 'file').toUpperCase()}</span>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" onClick={() => trackDownload.mutate(r._id)}
                    className="btn-ghost text-xs py-1 px-2 flex items-center gap-1 text-primary">
                    <Download size={12} /> Get
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
        {resources?.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p>No resources available</p>
          </div>
        )}
      </div>
    </div>
  );
}
