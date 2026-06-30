import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon, LogOut, Globe, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/format';

export default function Topbar({ onMenuClick }) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/analytics/notifications').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: () => api.put('/analytics/notifications/read'),
    onSuccess: () => refetch(),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { clearAuth(); navigate('/login'); },
    onError: () => { clearAuth(); navigate('/login'); },
  });

  const notifications = notifData?.notifications || [];
  const unread = notifData?.unread || 0;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('neyron-lang', lang);
    setShowLang(false);
  };

  const notifIcons = { homework: '📚', exam: '✍️', announcement: '📢', achievement: '🏆', grade: '⭐', ai_reminder: '🤖' };

  return (
    <header className="h-14 md:h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 md:px-6 gap-2 md:gap-3 z-30 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex-shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Date — hidden on small mobile */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
          {new Date().toLocaleDateString(
            i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
            { weekday: 'long', month: 'long', day: 'numeric' }
          )}
        </h1>
      </div>

      {/* Language */}
      <div className="relative">
        <button
          onClick={() => setShowLang(!showLang)}
          className="btn-ghost flex items-center gap-1 text-xs sm:text-sm py-1.5 px-2 sm:px-3"
        >
          <Globe size={14} />
          <span className="uppercase font-semibold hidden sm:inline">{i18n.language}</span>
          <ChevronDown size={11} />
        </button>
        <AnimatePresence>
          {showLang && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-100 dark:border-gray-800 py-1 w-32 z-50"
            >
              {[{ code: 'uz', label: "O'zbek" }, { code: 'ru', label: 'Русский' }, { code: 'en', label: 'English' }].map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${i18n.language === l.code ? 'text-primary font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                  {l.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme toggle */}
      <button onClick={toggle} className="btn-ghost p-2 rounded-xl flex-shrink-0">
        {theme === 'dark' ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-gray-600" />}
      </button>

      {/* Notifications */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setShowNotifs(!showNotifs); if (unread > 0) markRead.mutate(); }}
          className="btn-ghost p-2 rounded-xl relative"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <AnimatePresence>
          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 w-72 sm:w-80 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="font-semibold text-sm">{t('notifications')}</span>
                {notifications.length > 0 && (
                  <button onClick={() => markRead.mutate()} className="text-xs text-primary hover:underline">{t('mark_all_read')}</button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">{t('no_notifications')}</div>
                ) : notifications.map(n => (
                  <div key={n._id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.isRead ? 'bg-primary-50/30' : ''}`}>
                    <div className="flex gap-3">
                      <span className="text-xl flex-shrink-0">{notifIcons[n.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 dark:text-white">{n.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout */}
      <button
        onClick={() => logoutMutation.mutate()}
        className="btn-ghost p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
