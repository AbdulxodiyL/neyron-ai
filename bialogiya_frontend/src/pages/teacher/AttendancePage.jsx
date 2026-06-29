import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Clock, Users, Save } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

const STATUS_INFO = { present: { color: 'bg-green-100 text-green-700 border-green-300', icon: Check }, late: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock }, absent: { color: 'bg-red-100 text-red-600 border-red-300', icon: X } };

export default function AttendancePage() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selectedGroup, setSelectedGroup] = useState('');
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState({});

  const { data: groups } = useQuery({ queryKey: ['my-groups'], queryFn: () => api.get('/groups').then(r => r.data.data) });
  const group = groups?.find(g => g._id === selectedGroup);

  const { data: existingRecord } = useQuery({
    queryKey: ['attendance', selectedGroup, date],
    queryFn: () => api.get(`/attendance/${selectedGroup}?date=${date}`).then(r => r.data.data),
    enabled: !!selectedGroup,
    onSuccess: (data) => {
      if (data?.records) {
        const map = {};
        data.records.forEach(r => { map[r.studentId] = r.status; });
        setAttendance(map);
      } else {
        const map = {};
        group?.students?.forEach(s => { map[s._id] = 'present'; });
        setAttendance(map);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post('/attendance', { groupId: selectedGroup, date, records: Object.entries(attendance).map(([studentId, status]) => ({ studentId, status })) }),
    onSuccess: () => { qc.invalidateQueries(['attendance']); toast.success('Attendance saved!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const setAll = (status) => {
    const map = {};
    group?.students?.forEach(s => { map[s._id] = status; });
    setAttendance(map);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Attendance</h1>

      <div className="card mb-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1.5">Group</label>
            <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setAttendance({}); }} className="input-field">
              <option value="">Select group</option>
              {groups?.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium mb-1.5">Date</label>
            <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className="input-field" /></div>
        </div>
      </div>

      {selectedGroup && group && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600"><span className="font-semibold text-primary">{presentCount}</span> / {group.students?.length || 0} present</div>
            <div className="flex gap-2">
              {['present', 'late', 'absent'].map(s => (
                <button key={s} onClick={() => setAll(s)} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${STATUS_INFO[s].color}`}>
                  All {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {group.students?.map((student, i) => {
              const current = attendance[student._id] || 'present';
              return (
                <motion.div key={student._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="card flex items-center gap-3 py-3">
                  <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {student.name?.charAt(0)}
                  </div>
                  <span className="flex-1 font-medium text-sm">{student.name}</span>
                  <div className="flex gap-1.5">
                    {['present', 'late', 'absent'].map(s => {
                      const info = STATUS_INFO[s];
                      const Icon = info.icon;
                      const active = current === s;
                      return (
                        <button key={s} onClick={() => setAttendance(a => ({ ...a, [student._id]: s }))}
                          className={`p-1.5 rounded-lg border transition-all ${active ? info.color : 'border-gray-200 text-gray-300 hover:border-gray-300'}`}>
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <Save size={15} /> {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
          </button>
        </>
      )}
    </div>
  );
}
