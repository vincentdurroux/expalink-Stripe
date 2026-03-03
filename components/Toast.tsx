import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-black/80', icon: <CheckCircle2 className="text-emerald-400" size={18} /> },
    error: { bg: 'bg-red-600/90', icon: <AlertCircle className="text-white" size={18} /> },
    info: { bg: 'bg-indigo-600/90', icon: <CheckCircle2 className="text-white" size={18} /> }
  };

  const style = config[type] || config.success;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[12000] px-4 w-full max-w-sm animate-toast-in">
      <div className={`${style.bg} backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center gap-4 text-white`}>
        <div className="shrink-0">{style.icon}</div>
        <p className="flex-1 text-sm font-bold tracking-tight">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;