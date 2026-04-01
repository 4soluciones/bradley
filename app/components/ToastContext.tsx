'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'warning' | 'danger';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  danger: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-white dark:text-green-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-white dark:text-yellow-400" />,
  danger: <XCircle className="w-5 h-5 text-white dark:text-red-400" />
};

const bgMap = {
  success: 'bg-green-600 dark:bg-green-950/40 border-green-700 dark:border-green-900/50',
  warning: 'bg-orange-500 dark:bg-orange-950/40 border-orange-600 dark:border-orange-900/50',
  danger: 'bg-red-600 dark:bg-red-950/40 border-red-700 dark:border-red-900/50'
};

const textMap = {
  success: 'text-white dark:text-green-300',
  warning: 'text-white dark:text-orange-300',
  danger: 'text-white dark:text-red-300'
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000); // auto remove after 5s
  }, [removeToast]);

  const success = useCallback((message: string) => toast('success', message), [toast]);
  const warning = useCallback((message: string) => toast('warning', message), [toast]);
  const danger = useCallback((message: string) => toast('danger', message), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, warning, danger }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg sm:w-80 w-auto ${bgMap[t.type]}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {iconMap[t.type]}
              </div>
              <div className={`flex-1 text-sm font-medium ${textMap[t.type]}`}>
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 ml-auto text-white/70 hover:text-white dark:text-foreground/40 dark:hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
