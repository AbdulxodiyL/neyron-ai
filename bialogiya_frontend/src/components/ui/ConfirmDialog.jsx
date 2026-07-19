import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';

/**
 * Usage:
 *   const [confirm, setConfirm] = useState(null); // {title, message, onConfirm}
 *   <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
 *   ...
 *   setConfirm({ title: "O'chirishni tasdiqlaysizmi?", message: `"${name}" o'chiriladi`, onConfirm: () => doDelete(id) });
 */
export default function ConfirmDialog({ confirm, onClose }) {
  if (!confirm) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 12 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white text-base">
                {confirm.title || "O'chirishni tasdiqlaysizmi?"}
              </h3>
              {confirm.message && (
                <p className="text-sm text-gray-500 mt-0.5">{confirm.message}</p>
              )}
            </div>
          </div>

          {confirm.warning && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              {confirm.warning}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="btn-ghost flex-1 py-2.5">
              Bekor qilish
            </button>
            <button
              onClick={() => { confirm.onConfirm(); onClose(); }}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold text-sm transition-colors"
            >
              {confirm.confirmLabel || "Ha, o'chirish"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
