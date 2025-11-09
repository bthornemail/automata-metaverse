import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAutomatonStore } from '@/store/automatonStore';
import type { Notification } from '@/store/automatonStore';

export const Toast: React.FC<{ notification: Notification }> = ({ notification }) => {
  const removeNotification = useAutomatonStore((state) => state.removeNotification);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-600/90 border-green-500',
    error: 'bg-red-600/90 border-red-500',
    warning: 'bg-yellow-600/90 border-yellow-500',
    info: 'bg-blue-600/90 border-blue-500',
  };

  const Icon = icons[notification.type];

  // Safely convert message to string - prevent "entry.split" errors
  const safeMessage = React.useMemo(() => {
    if (!notification.message) return '';
    return String(notification.message);
  }, [notification.message]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 300 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`${colors[notification.type]} border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[300px] max-w-[500px]`}
    >
      <Icon className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-white text-sm">
        {safeMessage}
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-white/80 hover:text-white flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const notifications = useAutomatonStore((state) => state.notifications);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <Toast notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
