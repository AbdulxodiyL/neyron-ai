import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/axios';
import { getLevelProgress } from '../../utils/format';

export default function StudentLeaderboard() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['group-analytics', user?.groupId],
    queryFn: () => api.get(`/analytics/group/${user?.groupId}`).then(r => r.data.data),
    enabled: !!user?.groupId,
  });

  const leaderboard = data?.leaderboard || [];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Trophy size={24} className="text-yellow-500" /> Leaderboard
      </h1>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = ['h-24', 'h-32', 'h-20'];
            return (
              <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex-1 flex flex-col items-center ${heights[i]}`}>
                <div className="text-2xl mb-1">{medals[rank - 1]}</div>
                <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-sm mb-1">
                  {p.name?.charAt(0)}
                </div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center truncate w-full px-1">{p.name}</div>
                <div className={`w-full gradient-bg rounded-t-xl mt-2 flex items-center justify-center ${heights[i]}`}>
                  <div className="text-white text-xs font-bold">{p.xp} XP</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {leaderboard.map((player, i) => {
          const { level } = getLevelProgress(player.xp);
          const isMe = String(player._id) === String(user?._id);
          return (
            <motion.div key={player._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className={`card flex items-center gap-3 py-3 ${isMe ? 'border-primary/30 bg-primary/5' : ''}`}>
              <div className={`w-8 text-center font-bold text-sm ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                {player.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-800 dark:text-white">
                  {player.name} {isMe && <span className="text-xs text-primary">(You)</span>}
                </div>
                <div className="text-xs text-gray-400">Level {level}</div>
              </div>
              <div className="flex items-center gap-1 font-bold text-primary text-sm">
                <Zap size={13} /> {player.xp}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
