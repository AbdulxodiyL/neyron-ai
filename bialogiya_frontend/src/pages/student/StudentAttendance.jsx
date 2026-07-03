import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';

const STATUS_CONFIG = {
  present: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Present' },
  absent: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Absent' },
  late: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Late' },
};

export default function StudentAttendance() {
  const { user } = useAuthStore();
  const { data: records, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: () => api.get('/attendance/my').then(r => r.data.data),
  });

  const total = records?.length || 0;
  const present = records?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Attendance</h1>
      {user?.isFrozen && (
        <div className="mb-4 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          ❄️ Sizning hisobingiz muzlatilgan. Iltimos, o'qituvchingiz bilan bog'laning.
        </div>
      )}
      {total > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black gradient-text">{percentage}%</div>
            <div className="text-sm text-gray-500">Attendance Rate</div>
          </div>
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black text-green-500">{present}</div>
            <div className="text-sm text-gray-500">Present</div>
          </div>
          <div className="card flex-1 text-center py-4">
            <div className="text-3xl font-black text-gray-400">{total}</div>
            <div className="text-sm text-gray-500">Total Classes</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {records?.map((rec, i) => {
          const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.absent;
          const Icon = cfg.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-3 py-3">
              <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={cfg.color} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800 dark:text-white">Class</div>
                <div className="text-xs text-gray-400">{new Date(rec.date).toLocaleDateString()}</div>
              </div>
              <span className={`badge text-xs ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            </motion.div>
          );
        })}
        {!isLoading && total === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p>No attendance records yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
