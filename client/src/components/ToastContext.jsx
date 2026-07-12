import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900',
          text: 'text-emerald-800 dark:text-emerald-250',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900',
          text: 'text-rose-800 dark:text-rose-250',
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-900',
          text: 'text-amber-800 dark:text-amber-250',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-900',
          text: 'text-blue-800 dark:text-blue-250',
          icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const styles = getToastStyles(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${styles.bg} ${styles.text}`}
              >
                {styles.icon}
                <div className="flex-1 text-sm font-medium pr-2 leading-tight">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
