import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Dna, Atom, Bot } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else if (user.role === 'reception') navigate('/reception/teachers');
      else navigate('/admin/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('invalid_credentials')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Fill in all fields');
    loginMutation.mutate(form);
  };

  const floatingItems = [
    { icon: Dna, top: '15%', left: '8%', delay: 0, size: 32 },
    { icon: Atom, top: '70%', left: '5%', delay: 0.5, size: 28 },
    { icon: Bot, top: '20%', right: '8%', delay: 0.3, size: 30 },
    { icon: Dna, top: '75%', right: '6%', delay: 0.8, size: 26 },
    { icon: Atom, top: '45%', left: '12%', delay: 0.2, size: 20 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Floating biology/chemistry icons */}
      {floatingItems.map(({ icon: Icon, top, left, right, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/10 dark:text-primary/5"
          style={{ top, left, right }}
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4 + i, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon size={size + 30} strokeWidth={1} />
        </motion.div>
      ))}

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-soft">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-2xl shadow-glow mb-4"
            >
              <span className="text-white font-black text-2xl">A</span>
            </motion.div>
            <h1 className="text-2xl font-black gradient-text">{t('app_name')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('tagline')}</p>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('welcome_back')}</h2>
            <p className="text-sm text-gray-500">{t('login_subtitle')}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('username')}</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder={t('enter_username')}
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={t('enter_password')}
                  className="input-field pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loginMutation.isPending}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  {t('signing_in')}
                </span>
              ) : t('login')}
            </motion.button>
          </form>

        </div>

        {/* Bottom badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 mt-4 text-xs text-gray-400"
        >
          <span className="flex items-center gap-1">🧬 Biology</span>
          <span>•</span>
          <span className="flex items-center gap-1">⚗️ Chemistry</span>
          <span>•</span>
          <span className="flex items-center gap-1">🤖 AI Powered</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
