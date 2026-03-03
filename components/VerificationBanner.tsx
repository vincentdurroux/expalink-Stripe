
import React from 'react';
import { ShieldCheck, Clock, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { VerificationStatus } from '../types';
import { useTranslation } from 'react-i18next';

interface VerificationBannerProps {
  status: VerificationStatus;
  onAction?: () => void;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ status, onAction }) => {
  const { t } = useTranslation();
  
  // Si le statut est 'verified', on ne montre plus de bandeau de rappel/félicitations
  if (status === 'verified' || (status === 'none' && !onAction)) return null;

  const config = {
    none: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-600',
      icon: <ShieldCheck size={18} className="text-gray-400" />,
      message: t('dashboard.verification.banner.none'),
      btn: t('dashboard.verification.banner.cta')
    },
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <Clock size={18} className="text-amber-500 animate-pulse" />,
      message: t('dashboard.verification.banner.pending'),
      btn: null
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle size={18} className="text-red-600" />,
      message: t('dashboard.verification.banner.rejected'),
      btn: t('dashboard.verification.banner.cta')
    }
  };

  // Fallback au cas où status serait quand même 'verified' ici (sécurité JS)
  if (!config[status as keyof typeof config]) return null;

  const current = config[status as keyof typeof config];

  return (
    <div className={`w-full p-4 rounded-2xl border ${current.bg} ${current.border} ${current.text} flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm mb-8`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl shadow-sm">
          {current.icon}
        </div>
        <p className="text-sm font-bold leading-tight">
          {current.message}
        </p>
      </div>
      
      {current.btn && onAction && (
        <button 
          onClick={onAction}
          className="whitespace-nowrap flex items-center gap-2 px-5 py-2 bg-white rounded-xl text-xs font-black border border-current/20 hover:shadow-md transition-all active:scale-95"
        >
          {current.btn} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default VerificationBanner;
