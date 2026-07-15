import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Bot, Shield, Globe } from 'lucide-react';
import api from '../../config/axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState({ platformName: 'Abdora AI', defaultLanguage: 'uz', aiEnabled: true, registrationOpen: false, maxGroupSize: 30, passingScore: 60 });

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/admin/settings', d),
    onSuccess: () => toast.success('Settings saved!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const sections = [
    {
      title: 'Platform',
      icon: Globe,
      color: 'text-primary',
      fields: [
        { key: 'platformName', label: 'Platform Name', type: 'text' },
        { key: 'defaultLanguage', label: 'Default Language', type: 'select', options: [['uz', "O'zbek"], ['ru', 'Русский'], ['en', 'English']] },
        { key: 'maxGroupSize', label: 'Max Group Size', type: 'number' },
        { key: 'passingScore', label: 'Passing Score (%)', type: 'number' },
      ],
    },
    {
      title: 'AI Settings',
      icon: Bot,
      color: 'text-secondary',
      fields: [
        { key: 'aiEnabled', label: 'AI Content Generation', type: 'toggle' },
      ],
    },
    {
      title: 'Access Control',
      icon: Shield,
      color: 'text-purple-500',
      fields: [
        { key: 'registrationOpen', label: 'Open Registration', type: 'toggle' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Platform Settings</h1>

      <div className="space-y-5">
        {sections.map(({ title, icon: Icon, color, fields }, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Icon size={18} className={color} />
              <h2 className="font-bold text-gray-800 dark:text-white">{title}</h2>
            </div>
            <div className="space-y-4">
              {fields.map(({ key, label, type, options }) => (
                <div key={key}>
                  {type === 'toggle' ? (
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                      <button onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings[key] ? 'bg-primary' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings[key] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ) : type === 'select' ? (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{label}</label>
                      <select value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} className="input-field">
                        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">{label}</label>
                      <input type={type} value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: type === 'number' ? +e.target.value : e.target.value }))} className="input-field" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <button onClick={() => saveMutation.mutate(settings)} disabled={saveMutation.isPending}
        className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
        <Save size={15} /> {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
