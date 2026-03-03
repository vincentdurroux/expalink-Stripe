import React, { useEffect, useState } from 'react';
import { Search, Coins, Unlock, Phone, Star, X, Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HowItWorksProps {
  onClose: () => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const steps = [
    {
      number: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.desc'),
      icon: <Search className="text-blue-600" size={24} />,
      bgClass: "bg-blue-50/50",
      accent: "border-blue-100",
      dot: "bg-blue-400"
    },
    {
      number: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.desc'),
      icon: <Coins className="text-amber-500" size={24} />,
      bgClass: "bg-amber-50/50",
      accent: "border-amber-100",
      dot: "bg-amber-400"
    },
    {
      number: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.desc'),
      icon: <Unlock className="text-indigo-600" size={24} />,
      bgClass: "bg-indigo-50/50",
      accent: "border-indigo-100",
      dot: "bg-indigo-400"
    },
    {
      number: "04",
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.desc'),
      icon: <Phone className="text-emerald-600" size={24} />,
      bgClass: "bg-emerald-50/50",
      accent: "border-emerald-100",
      dot: "bg-emerald-400"
    },
    {
      number: "05",
      title: t('howItWorks.step5.title'),
      description: t('howItWorks.step5.desc'),
      icon: <Star className="text-violet-600" size={24} />,
      bgClass: "bg-violet-50/50",
      accent: "border-violet-100",
      dot: "bg-violet-400"
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 transition-all duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Backdrop with stronger blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xl transition-all duration-500" 
        onClick={handleClose} 
      />

      {/* Floating Window Container */}
      <div 
        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] transform"
        style={{ 
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.92)',
          maxHeight: '90vh'
        }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-8 md:p-10 border-b border-gray-50 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-emerald-500 text-white rounded-[20px] flex items-center justify-center shadow-lg shadow-indigo-100">
              <Sparkles size={28} fill="currentColor" className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {t('howItWorks.title')}
              </h2>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps Content - Scrollable */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-12">
          <p className="text-gray-500 font-medium text-base mb-12 text-center md:text-left max-w-md leading-relaxed animate-in fade-in slide-in-from-top-2 duration-700">
            {t('howItWorks.subtitle')}
          </p>

          <div className="relative space-y-10 pb-8">
            {/* Connection Line Desktop */}
            <div className="absolute left-10 top-8 bottom-16 w-0.5 bg-gradient-to-b from-gray-100 via-gray-200 to-transparent hidden md:block" />

            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`group flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start relative animate-in fade-in slide-in-from-left-4 duration-700`}
                style={{ transitionDelay: `${(index + 1) * 150}ms`, animationDelay: `${(index + 1) * 150}ms` }}
              >
                {/* Visual Step Marker */}
                <div className="relative shrink-0 z-10">
                  <div className={`w-20 h-20 rounded-[28px] border-2 ${step.accent} bg-white flex items-center justify-center shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500 overflow-hidden`}>
                     <div className={`absolute inset-0 ${step.bgClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
                     <div className="relative z-10 group-hover:scale-110 transition-transform duration-500">
                       {step.icon}
                     </div>
                  </div>
                  <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-gray-100 shadow-md flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-gray-900 group-hover:border-black transition-all`}>
                    {step.number}
                  </div>
                </div>

                {/* Step Text */}
                <div className="flex-1 text-center md:text-left pt-2">
                  <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors flex items-center justify-center md:justify-start gap-2">
                    {step.title}
                    <div className={`w-2 h-2 rounded-full ${step.dot} opacity-0 group-hover:opacity-100 transition-opacity hidden md:block`} />
                  </h3>
                  <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed max-w-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-staggered {
          animation: fade-in-slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HowItWorks;