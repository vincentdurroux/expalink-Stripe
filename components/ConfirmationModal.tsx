import { useEffect, useState, useMemo } from 'react';
import { X, Repeat, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean; onClose: () => void; onConfirm: () => void | Promise<void>; title: string; message: string; confirmLabel: string; type: 'expat' | 'pro'; requireTextConfirmation?: string; isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, type, requireTextConfirmation, isLoading = false }) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  
  useEffect(() => { 
    if (isOpen) { 
      document.body.style.overflow = 'hidden'; 
      setInputValue(''); 
    } else { 
      document.body.style.overflow = 'unset'; 
    } 
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const themeClasses = useMemo(() => {
    if (requireTextConfirmation) {
      return {
        iconBg: 'bg-red-50 text-red-600',
        btnBg: 'bg-red-600 text-white hover:bg-red-700 shadow-red-100',
        inputRing: 'focus:ring-red-500/5'
      };
    }
    
    if (type === 'pro') {
      return {
        iconBg: 'bg-emerald-50 text-emerald-600',
        btnBg: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100',
        inputRing: 'focus:ring-emerald-500/5'
      };
    }

    return {
      iconBg: 'bg-indigo-50 text-indigo-600',
      btnBg: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100',
      inputRing: 'focus:ring-indigo-500/5'
    };
  }, [type, requireTextConfirmation]);

  if (!isOpen) return null;
  const isActionDisabled = isLoading || (requireTextConfirmation ? inputValue.toLowerCase() !== requireTextConfirmation.toLowerCase() : false);

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={() => !isLoading && onClose()} />
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 md:p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        {!isLoading && <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-all"><X size={20} /></button>}
        
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${themeClasses.iconBg}`}>
          {requireTextConfirmation ? <AlertCircle size={32} /> : <Repeat size={32} className={isLoading ? 'animate-spin' : ''} />}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
        
        {requireTextConfirmation && (
          <div className="w-full mb-8 space-y-2 text-left">
            <label className="text-[10px] font-bold uppercase text-gray-400 block ml-1">
              {t('profile.confirmInputLabel', { text: requireTextConfirmation })}
            </label>
            <input 
              type="text" 
              autoFocus 
              disabled={isLoading} 
              className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-center font-bold outline-none focus:ring-4 ${themeClasses.inputRing}`} 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
            />
          </div>
        )}
        
        <button 
          onClick={() => !isActionDisabled && onConfirm()} 
          disabled={isActionDisabled} 
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${themeClasses.btnBg}`}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>{confirmLabel} <ArrowRight size={18} /></>}
        </button>
        
        <button onClick={onClose} className="w-full mt-3 py-4 text-gray-400 font-bold text-sm hover:text-gray-900 transition-all">
          {t('common.close')}
        </button>
        
        <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-300">
          <ShieldCheck size={12} />{t('auth.secureBy')}
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;