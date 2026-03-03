import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Check, Sparkles, ArrowLeft, Clock, Zap, Trophy, CheckCircle2, CreditCard, AlertCircle, Edit3, Lock, Loader2, ChevronRight, Info, ChevronLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

interface ProSubscriptionPageProps {
  profile: any;
  onSelect: (planId: string, withRecommended?: boolean) => void | Promise<void>; 
  onBack: () => void; 
  onGoToEdit?: () => void;
  onReactivate?: () => void; 
  currentPlan?: string | null; 
  planStatus?: 'active' | 'cancelling' | null; 
  cancelAtPeriodEnd?: boolean;
  isFeatured?: boolean;
}

const ProSubscriptionPage: React.FC<ProSubscriptionPageProps> = ({ 
  profile,
  onSelect, 
  onBack, 
  onGoToEdit,
  onReactivate,
  currentPlan, 
  isFeatured = false
}) => {
  const { t, i18n } = useTranslation();
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const normalizedActivePlanKey = useMemo(() => {
    if (!currentPlan) return null;
    const p = currentPlan.toLowerCase();
    if (p.includes('early') || p.includes('founding')) return 'early';
    if (p.includes('monthly')) return 'monthly';
    if (p.includes('elite') || p.includes('annual')) return 'elite';
    return p;
  }, [currentPlan]);

  // État de résiliation active pour le plan Fondateur
  const isCurrentlyCancellingFounding = useMemo(() => {
    return normalizedActivePlanKey === 'early' && profile?.plan_status === 'cancelling';
  }, [normalizedActivePlanKey, profile]);

  // État expiré
  const isExpired = useMemo(() => {
    return profile?.subscription_ends_at && new Date(profile.subscription_ends_at).getTime() < new Date().getTime();
  }, [profile]);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>('early');
  const [withFeaturedBadge, setWithFeaturedBadge] = useState<boolean>(false);

  useEffect(() => {
    // Force la sélection sur 'early' car les autres sont désactivés
    if (selectedPlanId !== 'early') setSelectedPlanId('early');
    setWithFeaturedBadge(false);
  }, [selectedPlanId]);

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = direction === 'left' ? -cardWidth * 0.8 : cardWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const completionPercentage = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.full_name?.trim()) score += 10;
    if (profile.pro_image_url || profile.avatar_url) score += 10;
    if (profile.nationality || (Array.isArray(profile.nationality) && profile.nationality.length > 0)) score += 10;
    if (profile.phone?.trim()) score += 10;
    if (profile.professions?.length > 0) score += 10;
    if (profile.years_experience) score += 5;
    if (profile.bio?.length >= 20) score += 20; 
    if (profile.all_cities?.length > 0) score += 10;
    if (profile.languages?.length > 0) score += 10;
    if (profile.specialties?.length > 0) score += 5; 
    return Math.min(100, score);
  }, [profile]);

  const isProfileIncomplete = completionPercentage < 85;

  const plans = useMemo(() => {
    const getFeatures = (key: string) => {
      const f = t(key, { returnObjects: true });
      return Array.isArray(f) ? f : [];
    };

    return [
      { 
        id: 'early', 
        rpcName: 'Founding Member', 
        name: t('subscription.plans.early.name'), 
        basePrice: 0,
        features: getFeatures('subscription.plans.early.features'), 
        isAvailable: !isExpired, // Toujours dispo sauf si réellement expiré après 1 an
        icon: <Clock className="text-blue-500" size={24} />,
        billingType: 'free',
        colorClass: 'bg-blue-50/80 border-blue-100',
        summaryClass: 'bg-blue-50 border-blue-200 shadow-blue-900/5',
        accentColor: 'text-blue-600',
        activeBadgeBg: 'bg-blue-600'
      },
      { 
        id: 'monthly', 
        rpcName: 'Monthly Pro', 
        name: t('subscription.plans.monthly.name'), 
        basePrice: 25,
        features: getFeatures('subscription.plans.monthly.features'), 
        isAvailable: false, // GRISÉ
        icon: <Zap size={24} className="text-orange-500" />,
        billingType: 'monthly',
        colorClass: 'bg-gray-50 border-gray-100 opacity-40 grayscale',
        summaryClass: 'bg-orange-50 border-orange-200',
        accentColor: 'text-orange-600',
        activeBadgeBg: 'bg-orange-600'
      },
      { 
        id: 'elite', 
        rpcName: 'Annual Pro', 
        name: t('subscription.plans.elite.name'), 
        basePrice: 19, 
        originalPrice: 25,
        features: getFeatures('subscription.plans.elite.features'), 
        isAvailable: false, // GRISÉ
        icon: <Trophy size={24} className="text-violet-600" />,
        billingType: 'annual',
        annualPrice: 228,
        colorClass: 'bg-gray-50 border-gray-100 opacity-40 grayscale',
        summaryClass: 'bg-violet-100/40 border-violet-300',
        accentColor: 'text-violet-700',
        activeBadgeBg: 'bg-violet-700'
      }
    ];
  }, [t, isExpired]);

  const currentSelectedPlan = plans.find(p => p.id === selectedPlanId);
  const isCurrentActiveConfig = selectedPlanId === normalizedActivePlanKey && profile?.plan_status === 'active';

  const handleAction = async () => {
    if (!currentSelectedPlan || isSelecting || isProfileIncomplete || isCurrentActiveConfig) return;
    
    setIsSelecting(currentSelectedPlan.id);
    try {
      if (isCurrentlyCancellingFounding && onReactivate) {
        await onReactivate();
      } else {
        await onSelect(currentSelectedPlan.rpcName, false);
      }
    } finally {
      setIsSelecting(null);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    // Scroll to summary after a short delay to allow state update
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="min-h-screen px-6 pt-24 md:pt-32 pb-64 animate-in fade-in relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-gray-400 hover:text-black font-semibold text-[10px] uppercase tracking-widest group transition-all">
          <ArrowLeft size={18} className="group-hover:-translate-x-1" /> {t('common.back')}
        </button>

        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 leading-tight">
            {isCurrentlyCancellingFounding ? "Réactivez votre offre" : (
              <>
                {t('subscription.chooseVisibility')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">
                  {i18n.language?.startsWith('fr') ? 'visibilité' : i18n.language?.startsWith('es') ? 'visibilidad' : 'visibility'}
                </span>
              </>
            )}
          </h1>
          <p className="text-gray-500 font-medium text-base md:text-lg leading-relaxed">{t('subscription.launchOffer')}</p>
        </div>

        {isProfileIncomplete && (
          <div className="mb-12 p-5 bg-amber-50 border border-amber-100 rounded-[28px] flex flex-col md:row items-center gap-4 shadow-sm max-w-2xl mx-auto">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><AlertCircle size={20} /></div>
            <p className="flex-1 text-xs text-amber-900 font-bold text-center md:text-left">
              {t('common.incompleteProfileAlert', { percentage: completionPercentage })}
            </p>
            <button onClick={onGoToEdit} className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase hover:bg-amber-700 transition-all flex items-center gap-2 shrink-0">
              <Edit3 size={14} /> {t('common.incompleteProfileCTA')}
            </button>
          </div>
        )}

        <div className="relative group/carousel mb-14 z-20">
          <div 
            ref={scrollContainerRef}
            onScroll={updateScrollButtons}
            className="flex md:grid md:grid-cols-3 gap-6 md:gap-6 overflow-x-auto md:overflow-x-visible no-scrollbar snap-x snap-mandatory -mx-6 px-6 pt-4 pb-4"
          >
            {plans.map(plan => {
              const isActive = plan.id === normalizedActivePlanKey && profile?.plan_status === 'active';
              const isSelected = plan.id === selectedPlanId;
              const isDisabled = !plan.isAvailable && !isActive;
              
              return (
                <div 
                  key={plan.id} 
                  onClick={() => !isDisabled && handlePlanSelect(plan.id)}
                  className={`snap-center shrink-0 w-[78vw] sm:w-[320px] md:w-auto p-9 rounded-[36px] border-2 transition-all duration-300 flex flex-col relative min-h-[440px] ${
                    isDisabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer'
                  } ${
                    isSelected ? 'border-black shadow-2xl scale-[1.03] z-10 bg-white' : isActive ? 'border-indigo-400' : 'border-transparent'
                  } ${plan.colorClass}`}
                >
                  <div className="flex items-center justify-between mb-7">
                    <div className="p-3 bg-white/60 rounded-[16px] shadow-sm">{plan.icon}</div>
                    {isActive && (
                      <div className={`${plan.activeBadgeBg} text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest`}>
                        Actif
                      </div>
                    )}
                    {isCurrentlyCancellingFounding && plan.id === 'early' && (
                      <div className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                        Résilié
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-extrabold text-gray-900 mb-1.5">{plan.name}</h3>
                  
                  <div className="mb-9 h-20 flex flex-col justify-end">
                     <div className="flex items-baseline gap-2">
                       {(plan as any).originalPrice && (
                         <div className="text-2xl font-bold text-gray-300 line-through mr-1 opacity-80">{(plan as any).originalPrice}€</div>
                       )}
                       <div className="text-5xl font-black text-gray-900 tracking-tighter">{plan.basePrice}€</div>
                       <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">/ {t('subscription.billing.perMonth')}</div>
                     </div>
                     <div className="text-[10px] font-bold text-gray-500 uppercase mt-2 tracking-tight opacity-70">
                       {plan.id === 'early' 
                         ? t('subscription.freeDuration') 
                         : plan.billingType === 'annual' 
                           ? t('subscription.billing.total', { amount: (plan as any).annualPrice }) 
                           : t('subscription.billing.monthly')}
                     </div>
                  </div>

                  <div className="space-y-3.5 mb-8 flex-1">
                    {plan.features.map(f => (
                      <div key={f} className={`flex items-start gap-3 text-xs md:text-sm font-bold text-gray-700`}>
                        <Check size={14} className={`${plan.accentColor} shrink-0 mt-0.5`} />
                        <span className="leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>

                  {isDisabled && (
                    <div className="mt-auto pt-4 text-[10px] font-bold uppercase text-gray-400 text-center tracking-widest border-t border-black/5">
                      {t('subscription.comingSoon')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-10 p-6 md:p-8 bg-blue-50/50 border border-blue-100 rounded-[32px] flex items-start gap-5 shadow-sm relative z-10">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0"><Info size={24} /></div>
           <div className="space-y-1">
             <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">{t('subscription.whyDisabledTitle')}</h4>
             <p className="text-xs md:text-sm text-blue-800/70 font-medium leading-relaxed">{t('subscription.whyDisabledDesc')}</p>
           </div>
        </div>

        {selectedPlanId === 'early' && (
          <div ref={summaryRef} className={`mt-16 md:mt-24 p-10 md:p-14 rounded-[48px] border shadow-2xl max-w-2xl mx-auto flex flex-col items-center animate-in slide-in-from-bottom-4 relative overflow-hidden transition-all duration-500 ${currentSelectedPlan?.summaryClass || 'bg-white border-gray-100'}`}>
            <div className={`text-[12px] font-bold uppercase tracking-[0.3em] mb-10 ${currentSelectedPlan?.accentColor || 'text-gray-400'}`}>
              {t('subscription.summary.title')}
            </div>
            
            <div className="w-full space-y-4 mb-12">
              <div className="flex justify-between items-center pb-5 border-b border-black/5">
                 <div className="text-left">
                   <div className="text-sm font-bold text-gray-900">{currentSelectedPlan?.name}</div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('subscription.summary.commitmentMonthly')}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-2xl font-black text-gray-900">0,00€</div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">/ {t('subscription.billing.perMonth')}</div>
                 </div>
              </div>

              <div className="flex justify-between items-end pt-4">
                <div className="text-left">
                  <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">{t('subscription.summary.totalToday')}</div>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-gray-900 tracking-tighter">0€</div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAction}
              disabled={!!isSelecting || isProfileIncomplete || isCurrentActiveConfig}
              className={`w-full py-6 rounded-[24px] font-bold text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl ${
                isCurrentActiveConfig ? `${currentSelectedPlan?.activeBadgeBg} text-white shadow-indigo-100` :
                isProfileIncomplete ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 
                'bg-black text-white hover:bg-gray-800 shadow-black/10'
              }`}
            >
              {isSelecting ? <Loader2 size={24} className="animate-spin" /> : 
               isCurrentActiveConfig ? <CheckCircle2 size={24} /> :
               isCurrentlyCancellingFounding ? <><RefreshCw size={24} /> Réactiver mon offre</> :
               <><CreditCard size={24} /> {t('subscription.summary.payBtn')}</>}
            </button>
            
            <div className="mt-8 flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} /> {t('subscription.summary.securityNote')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProSubscriptionPage;