import React, { useState } from 'react';
import { Coins, Check, Zap, ShieldCheck, CreditCard, ArrowLeft, Loader2, Sparkles, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreditsPageProps {
  currentCredits: number;
  isAuth: boolean;
  isRoleSelected: boolean;
  onAuthRequired: () => void;
  onPurchase: (amount: number) => void | Promise<void>;
  onBack: () => void;
  userEmail?: string;
  userId?: string;
}

const CreditsPage: React.FC<CreditsPageProps> = ({ 
  currentCredits, 
  isAuth, 
  isRoleSelected, 
  onAuthRequired, 
  onPurchase,
  onBack
}) => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const plans = [
    { 
      id: 1, 
      amount: 1, 
      price: 1, 
      label: t('credits.pack1.label'), 
      desc: t('credits.pack1.desc'),
      icon: <Coins size={32} />,
      color: 'bg-gray-50 text-gray-400',
      btnColor: 'bg-white border-2 border-gray-100 text-gray-900 hover:bg-gray-50'
    },
    { 
      id: 2, 
      amount: 5, 
      price: 3, 
      label: t('credits.pack2.label'), 
      desc: t('credits.pack2.desc'),
      isPopular: true,
      icon: <Zap size={32} />,
      color: 'bg-indigo-600 text-white',
      btnColor: 'bg-black text-white hover:bg-gray-800 shadow-xl shadow-indigo-100'
    }
  ];

  const handlePurchase = async (amount: number) => {
    if (!isAuth) {
      onAuthRequired();
      return;
    }
    if (!isRoleSelected) return;
    
    setIsProcessing(amount);
    try {
      await onPurchase(amount);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-6 pt-24 pb-20 animate-in fade-in duration-700 relative">
      <div className="w-full max-w-4xl">
        <button 
          onClick={onBack}
          className="mb-12 flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-bold text-[10px] uppercase tracking-[0.2em] group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('common.back')}
        </button>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#1d1d1f] mb-4">
            {t('credits.title')}
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-base md:text-lg font-medium">
            {t('credits.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`apple-card p-10 border border-gray-100 flex flex-col items-center text-center bg-white transition-all group relative ${plan.isPopular ? 'md:scale-105 z-10 shadow-2xl ring-2 ring-indigo-500' : 'hover:shadow-xl'}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[9px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">
                    {t('common.mostPopular')}
                  </span>
                </div>
              )}
              
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:scale-110 ${plan.color}`}>
                 {plan.icon}
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{plan.label}</h3>
              <p className="text-gray-500 text-sm mb-10 font-medium">{plan.desc}</p>
              
              <div className="mb-10">
                <div className="flex items-center justify-center gap-2">
                   <span className="text-5xl font-black text-gray-900 tracking-tight">{plan.amount}</span>
                   <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('credits.unit')}</span>
                </div>
                <div className="text-indigo-600 font-bold text-xl mt-2">{plan.price}€</div>
              </div>

              <button 
                onClick={() => handlePurchase(plan.amount)}
                disabled={isProcessing !== null}
                className={`w-full py-5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 active:scale-95 ${plan.btnColor} disabled:opacity-50`}
              >
                {isProcessing === plan.amount ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {t('credits.buyCTA')}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 py-12 mt-16 border-t border-gray-100">
          <div className="flex items-center gap-3 opacity-60">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('credits.secure')}</span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <Check size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('credits.instant')}</span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <Star size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('credits.noExp')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;