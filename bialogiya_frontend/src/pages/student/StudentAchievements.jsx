import { motion } from 'framer-motion';
import { Trophy, Zap, Flame, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getLevelProgress } from '../../utils/format';

const SAMPLE_BADGES = [
  { icon: '🎯', name: 'First Lesson', desc: 'Completed your first lesson', earned: true, rarity: 'common' },
  { icon: '🏆', name: 'Quiz Master', desc: 'Scored 100% on a quiz', earned: false, rarity: 'rare' },
  { icon: '🔥', name: 'Week Streak', desc: '7-day learning streak', earned: false, rarity: 'epic' },
  { icon: '⚡', name: 'Speed Learner', desc: 'Completed 5 lessons in one day', earned: false, rarity: 'rare' },
  { icon: '🧬', name: 'Biology Expert', desc: 'Mastered all biology topics', earned: false, rarity: 'legendary' },
  { icon: '⚗️', name: 'Chem Whiz', desc: 'Mastered all chemistry topics', earned: false, rarity: 'legendary' },
  { icon: '💪', name: 'Homework Hero', desc: 'Submitted 10 assignments on time', earned: true, rarity: 'common' },
  { icon: '🌟', name: 'Perfect Score', desc: 'Got 100% on a test', earned: false, rarity: 'epic' },
];

const RARITY_COLORS = { common: 'from-gray-400 to-gray-500', rare: 'from-blue-400 to-blue-600', epic: 'from-purple-400 to-purple-600', legendary: 'from-yellow-400 to-orange-500' };

export default function StudentAchievements() {
  const { user } = useAuthStore();
  const { level, progress, xp } = getLevelProgress(user?.xp || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Achievements</h1>

      {/* Level & XP card */}
      <div className="gradient-bg rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Trophy size={30} className="text-yellow-300" />
          </div>
          <div className="flex-1">
            <div className="text-white/70 text-sm">Your Level</div>
            <div className="text-3xl font-black">Level {level}</div>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/70">
              <span className="flex items-center gap-1"><Zap size={13} /> {xp} XP</span>
              <span className="flex items-center gap-1"><Flame size={13} /> {user?.streak?.current || 0} streak</span>
              <span className="flex items-center gap-1"><Star size={13} /> {user?.coins || 0} coins</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Level {level}</span><span>Level {level + 1}</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.5 }}
              className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SAMPLE_BADGES.map((badge, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`card text-center p-4 ${!badge.earned ? 'opacity-40 grayscale' : ''}`}>
            <div className={`w-14 h-14 bg-gradient-to-br ${RARITY_COLORS[badge.rarity]} rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-soft`}>
              {badge.icon}
            </div>
            <div className="font-semibold text-sm text-gray-800 dark:text-white">{badge.name}</div>
            <div className="text-xs text-gray-400 mt-1">{badge.desc}</div>
            <div className={`badge mt-2 mx-auto text-xs bg-gradient-to-r ${RARITY_COLORS[badge.rarity]} text-white`}>
              {badge.rarity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
