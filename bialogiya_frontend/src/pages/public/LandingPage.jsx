import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, BookOpen, Video, Mic, Trophy, Building2, ArrowRight,
  CheckCircle2, Loader2, Phone, User, MessageSquare, Wand2, Brain,
} from 'lucide-react';
import api from '../../config/axios';

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI dars generatsiyasi',
    text: "Mavzu nomini kiriting — sun'iy intellekt bir necha soniyada tushuntirish, misollar, test va flashcard'lar yaratadi.",
  },
  {
    icon: BookOpen,
    title: 'Hikoya rejimi',
    text: "Har bir mavzu qiziqarli hikoyaga aylanadi va AI ovozida o'qib beriladi — yodda qolishi osonlashadi.",
  },
  {
    icon: Video,
    title: 'Tushuntiruvchi videolar',
    text: 'AI slaydlar, rasmlar va ovozli izoh bilan mavzuni video darsga aylantiradi.',
  },
  {
    icon: Mic,
    title: 'Jonli speaking mashqi',
    text: "O'quvchi AI bilan real vaqtda gaplashadi, AI xatolarni darhol, ammo hurmat bilan tuzatadi.",
  },
  {
    icon: Trophy,
    title: 'Gamifikatsiya',
    text: "XP, daraja va ketma-ketlik tizimi o'quvchini har kuni qaytib kelishga undaydi.",
  },
  {
    icon: Building2,
    title: 'Filial va guruh boshqaruvi',
    text: "Bir nechta filial, guruh jadvali, to'lovlar va o'qituvchilarni bitta panelda boshqaring.",
  },
];

export default function LandingPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setStatus('sending');
    try {
      await api.post('/applications', form);
      setStatus('sent');
      setForm({ name: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1420] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .display-font { font-family: 'Space Grotesk', system-ui, sans-serif; }
      `}</style>

      {/* Ambient glow backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center font-bold text-sm shadow-glow">A</div>
          <span className="display-font font-semibold text-lg">Abdora AI</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors border border-white/15 rounded-xl px-4 py-2 hover:border-white/30">
          Kirish
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/70 mb-6">
              <Sparkles size={12} className="text-primary" />
              AI yordamida o'qitadigan o'quv markazi platformasi
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="display-font text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              Har bir o'quvchi uchun
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">shaxsiy AI o'qituvchi.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="text-white/60 text-lg mt-6 max-w-lg leading-relaxed">
              Abdora AI — darslarni avtomatik yaratadigan, video va ovoz bilan tushuntiradigan, gaplashib mashq qildiradigan
              va filiallaringizni bitta joydan boshqarishga yordam beradigan platforma.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="flex flex-wrap gap-3 mt-8">
              <a href="#ariza" className="gradient-bg rounded-2xl px-6 py-3.5 font-semibold text-sm flex items-center gap-2 shadow-glow hover:opacity-90 transition-opacity">
                Ariza qoldirish <ArrowRight size={16} />
              </a>
              <a href="#imkoniyatlar" className="border border-white/15 rounded-2xl px-6 py-3.5 font-semibold text-sm text-white/80 hover:border-white/30 transition-colors">
                Imkoniyatlarni ko'rish
              </a>
            </motion.div>
          </div>

          {/* Signature visual: an AI-lesson card assembling itself */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="relative">
            <div className="relative bg-white/[0.04] border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4 text-xs text-white/50">
                <Brain size={13} className="text-primary" />
                AI dars generatsiya qilmoqda...
              </div>
              {['Mavzu: Fotosintez', 'Sodda tushuntirish ✓', 'Hikoya rejimi ✓', 'Video slaydlar ✓', 'Test savollari ✓'].map((line, i) => (
                <motion.div key={line} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex items-center gap-2.5 py-2.5 border-b border-white/5 last:border-0 text-sm">
                  <CheckCircle2 size={15} className="text-primary flex-shrink-0" />
                  <span className="text-white/80">{line}</span>
                </motion.div>
              ))}
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.3, duration: 0.5 }}
                className="h-1 gradient-bg rounded-full mt-4 origin-left" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 gradient-bg rounded-2xl opacity-20 blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="imkoniyatlar" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="max-w-xl mb-14">
          <h2 className="display-font text-3xl sm:text-4xl font-semibold tracking-tight">Nima qila oladi</h2>
          <p className="text-white/50 mt-3">Bitta platformada — o'quvchi, o'qituvchi va qabulxona uchun kerakli hamma narsa.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors">
                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Application form */}
      <section id="ariza" className="relative z-10 max-w-2xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-10">
          <h2 className="display-font text-3xl sm:text-4xl font-semibold tracking-tight">Ariza qoldiring</h2>
          <p className="text-white/50 mt-3">Ismingiz va telefon raqamingizni qoldiring — administratorimiz siz bilan bog'lanadi.</p>
        </div>

        {status === 'sent' ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 border border-primary/25 rounded-3xl p-10 text-center">
            <CheckCircle2 size={40} className="text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-1.5">Arizangiz qabul qilindi!</h3>
            <p className="text-white/60 text-sm">Tez orada siz bilan bog'lanamiz.</p>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5"><User size={12} /> Ism-familiya *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ismingiz" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5"><Phone size={12} /> Telefon raqami *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+998 90 123 45 67" required type="tel"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 flex items-center gap-1.5"><MessageSquare size={12} /> Xabar (ixtiyoriy)</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Qaysi yo'nalish qiziqtiradi, nechchi yoshda va h.k." rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors resize-none" />
            </div>
            <button type="submit" disabled={status === 'sending'}
              className="w-full gradient-bg rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50">
              {status === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {status === 'sending' ? 'Yuborilmoqda...' : 'Arizani yuborish'}
            </button>
            {status === 'error' && (
              <p className="text-xs text-red-400 text-center">Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.</p>
            )}
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/40">
        <span>© 2026 Abdora AI</span>
        <Link to="/login" className="hover:text-white/70 transition-colors">Tizimga kirish →</Link>
      </footer>
    </div>
  );
}
