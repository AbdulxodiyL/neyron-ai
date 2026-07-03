import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon, LogOut, Globe, ChevronDown, Menu, KeyRound, User, Eye, EyeOff } from 'lucide-react';
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
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  const changePwMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success('✅ Parol muvaffaqiyatli o\'zgartirildi!');
      setShowChangePw(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const handleChangePw = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) return toast.error('Barcha maydonlarni to\'ldiring');
    if (pwForm.newPw.length < 6) return toast.error('Yangi parol kamida 6 ta belgi bo\'lishi kerak');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Yangi parollar mos kelmaydi');
    changePwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
  };

  const notifications = notifData?.notifications || [];
  const unread = notifData?.unread || 0;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('neyron-lang', lang);
    setShowLang(false);
  };

  const notifIcons = { homework: '📚', exam: '✍️', announcement: '📢', achievement: '🏆', grade: '⭐', ai_reminder: '🤖' };

  return (
    <>
      <header className="h-14 md:h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-3 md:px-6 gap-2 md:gap-3 z-30 flex-shrink-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* Date */}
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
            onClick={() => { setShowLang(!showLang); setShowNotifs(false); setShowProfile(false); }}
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
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); setShowLang(false); if (unread > 0) markRead.mutate(); }}
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

        {/* User profile dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); setShowLang(false); }}
            className="flex items-center gap-2 btn-ghost py-1.5 px-2 rounded-xl"
          >
            <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user?.name?.charAt(0) || <User size={12} />}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block max-w-[100px] truncate">
              {user?.name}
            </span>
            <ChevronDown size={12} className="text-gray-400 hidden sm:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-800 w-52 z-50 overflow-hidden"
              >
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="font-semibold text-sm text-gray-800 dark:text-white truncate">{user?.name}</div>
                  <div className="text-xs text-gray-400">@{user?.username}</div>
                  <span className={`badge text-xs mt-1 ${user?.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {user?.role === 'teacher' ? 'O\'qituvchi' : user?.role === 'admin' ? 'Admin' : 'O\'quvchi'}
                  </span>
                  {user?.isFrozen && (
                    <div className="mt-2 text-xs text-blue-600 dark:text-blue-300">❄️ Hisobingiz muzlatilgan</div>
                  )}
                  {user?.lastPaymentAt && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Oxirgi to'lov: {new Date(user.lastPaymentAt).toLocaleDateString()}</div>
                  )}
                </div>
                {/* Change password */}
                <button
                  onClick={() => { setShowProfile(false); setShowChangePw(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <KeyRound size={14} className="text-primary" />
                  Parolni o'zgartirish
                </button>
                {/* Logout */}
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-800"
                >
                  <LogOut size={14} />
                  Chiqish
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Old logout button removed — now in profile dropdown */}
      </header>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowChangePw(false)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="text-center mb-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={22} className="text-primary" />
                </div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Parolni o'zgartirish</h2>
                <p className="text-sm text-gray-400 mt-1">Yangi parolingizni kiriting</p>
              </div>

              <div className="space-y-3">
                {/* Current password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Joriy parol *</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Hozirgi parolingiz"
                      className="input-field pr-10"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Yangi parol *</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                      placeholder="Kamida 6 ta belgi"
                      className="input-field pr-10"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwForm.newPw && (
                    <div className="mt-1.5 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          pwForm.newPw.length >= (i + 1) * 2
                            ? i < 1 ? 'bg-red-400' : i < 2 ? 'bg-yellow-400' : i < 3 ? 'bg-blue-400' : 'bg-green-400'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Yangi parolni tasdiqlang *</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Qaytadan kiriting"
                    className={`input-field ${pwForm.confirm && pwForm.newPw !== pwForm.confirm ? 'border-red-400 focus:border-red-400' : ''}`}
                  />
                  {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                    <p className="text-xs text-red-500 mt-1">Parollar mos kelmaydi</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowChangePw(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
                  className="btn-ghost flex-1">Bekor</button>
                <button
                  onClick={handleChangePw}
                  disabled={!pwForm.current || !pwForm.newPw || !pwForm.confirm || changePwMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-40">
                  {changePwMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
