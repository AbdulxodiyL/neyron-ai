import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../config/axios';

export default function StudentAttendance() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/attendance/my').then(r => r.data.data),
  });

  const STATUS_CONFIG = {
    present: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Present' },
    absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Absent' },
    late: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Late' },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Attendance</h1>
      {data && (
        <div className="flex gap-4 mb-6">
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black gradient-text">{data.percentage}%</div>
            <div className="text-sm text-gray-500">Attendance Rate</div>
          </div>
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black text-green-500">{data.present}</div>
            <div className="text-sm text-gray-500">Present</div>
          </div>
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black text-gray-400">{data.total}</div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {data?.records?.map((rec, i) => {
          const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
          const Icon = cfg.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-3 py-3">
              <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={cfg.color} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800 dark:text-white">{rec.lessonTitle || 'Class'}</div>
                <div className="text-xs text-gray-400">{new Date(rec.date).toLocaleDateString()}</div>
              </div>
              <span className={`badge text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
