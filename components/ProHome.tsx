import React, { useMemo, useState, useEffect } from 'react';
import { Sparkles, LayoutDashboard, ShieldCheck, Repeat, Award, Trophy, Star, CircleCheck, Circle, Info, Signal, SignalLow, ShieldOff, XCircle, User, Edit3, ShieldAlert, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProStats, mapDBRowToPro } from '../services/userService';
import ProfessionalCard from './ProfessionalCard';
import { Professional } from '../types';

interface ProHomeProps {
  userName: string; 
  profile: any; 
  isNewUser?: boolean; 
  onGoToDashboard: (scrollToVerification?: boolean) => void; 
  onEditProfile: () => void; 
  onUpgrade: () => void; 
  onSwitchToExpat: () => void;
  onViewProfile: (pro: Professional) => void;
  onAdminClick?: () => void;
}

const ProHome: React.FC<ProHomeProps> = ({ userName, profile, onGoToDashboard, onUpgrade, onSwitchToExpat, onEditProfile, onViewProfile, onAdminClick }) => {
  const { t, i18n } = useTranslation();
  const [motivationalPhrase, setMotivationalPhrase] = useState("");

  useEffect(() => {
    const phrases = t('proHome.motivational', { returnObjects: true }) as string[];
    if (Array.isArray(phrases) && phrases.length > 0) setMotivationalPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
  }, [profile, t]);

  const isFoundingMember = useMemo(() => {
    const plan = profile?.pro_plan?.toLowerCase() || '';
    return plan.includes('early') || plan.includes('founding');
  }, [profile?.pro_plan]);

  const proForCard: Professional = useMemo(() => {
    const basePro = mapDBRowToPro(profile);
    return {
      ...basePro,
      isEarlyMember: isFoundingMember 
    };
  }, [profile, i18n.language, isFoundingMember]);

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

  const normalizedPlanKey = useMemo(() => {
    const p = (profile?.pro_plan || '').toLowerCase();
    if (p.includes('early') || p.includes('founding')) return 'early';
    if (p.includes('monthly')) return 'monthly';
    if (p.includes('elite') || p.includes('annual')) return 'elite';
    return null;
  }, [profile?.pro_plan]);

  const formattedExpirationDate = useMemo(() => {
    if (!profile?.subscription_ends_at) return '';
    try {
      return new Date(profile.subscription_ends_at).toLocaleDateString(i18n.language, {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return new Date(profile.subscription_ends_at).toLocaleDateString();
    }
  }, [profile?.subscription_ends_at, i18n.language]);

  // RÈGLES DE VISIBILITÉ STRICTES
  const isProfileComplete = profile?.is_pro_complete === true;
  const isProfileApproved = profile?.bio_verification_status === 'approved';
  const isProfileRejected = profile?.bio_verification_status === 'rejected';
  
  // Un plan est considéré "actif" s'il est au statut 'active' OU s'il est 'cancelling' mais pas encore expiré
  const isPlanActive = profile?.plan_status === 'active' || 
    (profile?.plan_status === 'cancelling' && profile?.subscription_ends_at && new Date(profile.subscription_ends_at).getTime() > new Date().getTime());
  
  const isActuallyOnline = isProfileComplete && isPlanActive && isProfileApproved;

  const isIdentityVerified = profile?.verification_status === 'verified';
  const isIdentityPending = profile?.verification_status === 'pending';
  const isIdentityRejected = profile?.verification_status === 'rejected';

  const steps = useMemo(() => [
    {
      id: 1,
      title: t('proHome.steps.step1'),
      desc: (isProfileComplete && completionPercentage >= 85)
        ? t('proHome.steps.step1Completed', { percent: completionPercentage }) 
        : t('proHome.steps.step1Desc'),
      completed: isProfileComplete && completionPercentage >= 85,
      isPending: !isProfileComplete || completionPercentage < 85,
      mandatory: true,
      onClick: onEditProfile 
    },
    {
      id: 2,
      title: t('proHome.steps.step2'),
      desc: isProfileRejected 
        ? `${t('common.reason')}: "${profile?.bio_rejection_reason || t('proHome.steps.step2Rejected')}"`
        : (isProfileComplete && !isProfileApproved && !isProfileRejected ? t('proHome.steps.step2Pending') : ""),
      completed: isProfileApproved,
      isError: isProfileRejected,
      isPending: isProfileComplete && !isProfileApproved && !isProfileRejected,
      mandatory: true,
      onClick: isProfileRejected ? onEditProfile : undefined
    },
    {
      id: 3,
      title: profile?.plan_status === 'cancelling' ? t('proHome.steps.step3Cancelled') : t('proHome.steps.step3'),
      desc: isPlanActive && normalizedPlanKey
        ? (profile?.plan_status === 'cancelling' 
            ? t('dashboard.plan.expires', { date: formattedExpirationDate })
            : t('proHome.steps.step3Completed', { plan: t(`subscription.plans.${normalizedPlanKey}.name`) }))
        : t('proHome.steps.step3Desc'),
      completed: isPlanActive,
      isPending: !isPlanActive && isProfileComplete && isProfileApproved,
      mandatory: true,
      onClick: onUpgrade 
    },
    {
      id: 4,
      title: isIdentityVerified ? t('proHome.steps.step4') : t('proHome.steps.step4Pending'),
      desc: isIdentityRejected 
        ? t('proHome.steps.step4Rejected')
        : t('proHome.steps.step4Desc'),
      completed: isIdentityVerified,
      isPending: isIdentityPending,
      isError: isIdentityRejected,
      mandatory: false,
      onClick: () => onGoToDashboard(true) 
    }
  ], [t, isProfileComplete, completionPercentage, isProfileApproved, isProfileRejected, profile, isPlanActive, normalizedPlanKey, isIdentityVerified, isIdentityPending, isIdentityRejected, i18n.language, onEditProfile, onUpgrade, onGoToDashboard, formattedExpirationDate]);

  const containerBgClass = useMemo(() => {
    const hasAnyError = steps.some(s => s.isError);
    if (hasAnyError) return 'bg-red-100/70 border-red-200';
    const hasAnyPending = steps.some(s => s.isPending);
    if (hasAnyPending) return 'bg-orange-100/70 border-orange-200';
    const mandatoryDone = steps.filter(s => s.mandatory).every(s => s.completed);
    if (mandatoryDone) {
      if (isIdentityVerified) return 'bg-emerald-100/70 border-emerald-200';
      return 'bg-white border-gray-200';
    }
    return 'bg-white border-gray-100';
  }, [steps, isIdentityVerified]);

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <section className="pt-32 pb-16 md:pt-48 px-6 relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-start">
          
          <div className="lg:col-span-7 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[11px] font-semibold uppercase mb-10 border border-emerald-100 shadow-sm">
              <span className="flex items-center gap-2"><Sparkles size={14} /> {t('auth.welcome').toUpperCase()}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2 leading-[1.1] tracking-tight">
              {t('auth.welcome')}, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-50">
                {userName || 'Expert'}
              </span>
            </h1>

            {motivationalPhrase && (
              <div className="mb-16 italic font-medium text-gray-400 text-lg md:text-xl tracking-tight">
                "{motivationalPhrase}"
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14 w-full max-w-md lg:max-w-none">
              {profile?.is_admin && onAdminClick ? (
                <button onClick={onAdminClick} className="flex-1 bg-blue-600 text-white px-8 py-5 rounded-[22px] font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  Administration <ShieldAlert size={20} />
                </button>
              ) : (
                <>
                  <button onClick={() => onGoToDashboard()} className="flex-1 bg-black text-white px-8 py-5 rounded-[22px] font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.97]">
                    {t('proHome.dashboardBtn')} <LayoutDashboard size={20} />
                  </button>
                  <button onClick={onSwitchToExpat} className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-100 px-8 py-5 rounded-[22px] font-bold text-lg hover:bg-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-[0.97]">
                    <Repeat size={20} /> {t('proHome.switchToExpat')}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-5 flex flex-col items-center gap-8 w-full max-w-[420px] mx-auto">
            <div className={`w-full apple-card p-8 md:p-10 border shadow-[0_25px_60px_rgba(0,0,0,0.06)] relative overflow-hidden group animate-in slide-in-from-right-4 duration-700 transition-colors ${containerBgClass}`}>
               <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-10 pt-2">
                 <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                   <LayoutDashboard size={20} className="text-indigo-500" />
                   {t('proHome.steps.title')}
                 </h3>
                 
                 <div className="shrink-0">
                    {isActuallyOnline ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-in fade-in duration-1000">
                         <Signal size={14} className="animate-pulse" />
                         <span className="text-[10px] font-semibold uppercase tracking-widest">{t('proHome.steps.statusLive')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
                         {isProfileRejected || isIdentityRejected ? <ShieldOff size={14} className="text-red-400" /> : <SignalLow size={14} />}
                         <span className="text-[10px] font-semibold uppercase tracking-widest">{t('proHome.steps.statusHidden')}</span>
                      </div>
                    )}
                 </div>
               </div>

               <div className="space-y-8">
                  {steps.map((step) => (
                    <div 
                      key={step.id} 
                      onClick={step.onClick}
                      className={`flex items-start gap-5 ${step.onClick ? 'cursor-pointer hover:translate-x-1 transition-transform' : ''}`}
                    >
                       <div className={`shrink-0 mt-0.5 text-2xl transition-all duration-500 ${(step as any).isError ? 'opacity-100' : (step as any).isPending ? 'opacity-100 scale-110' : step.completed ? 'scale-110 opacity-100' : 'grayscale opacity-20'}`}>
                          {step.completed ? <span>✔️</span> : (step as any).isError ? <span className="text-red-500">❌</span> : (step as any).isPending ? <span className="text-amber-500">⏳</span> : <span>⚪</span>}
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className={`text-sm font-semibold transition-colors ${
                              (step as any).isError ? 'text-red-600' : 
                              (step.id === 3 && profile?.plan_status === 'cancelling') ? 'text-red-600' :
                              (step as any).isPending ? 'text-amber-500' : 
                              step.completed ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.title}
                            </h4>
                            {!step.mandatory && (
                              <span className="text-[9px] font-semibold text-indigo-400 uppercase border border-indigo-100 px-2 py-0.5 rounded-md bg-indigo-50/30">
                                {t('proHome.steps.optional')}
                              </span>
                            )}
                          </div>
                          {step.desc && (
                            <div className="mt-1">
                              <p className={`text-[11px] font-medium leading-tight ${
                                (step as any).isError ? 'text-red-600 italic' : 
                                (step as any).isPending ? 'text-amber-500/80 font-bold' : 
                                (step.id === 3 && profile?.plan_status === 'cancelling' && isPlanActive) ? 'text-emerald-600 font-bold' :
                                step.completed ? 'text-emerald-600' : 
                                'text-gray-300'
                              }`}>
                                {step.desc}
                              </p>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="relative w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="text-center mb-8">
                <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-[0.4em]">
                  {t('dashboard.badges.livePreviewLabel')}
                </span>
              </div>
              <ProfessionalCard professional={proForCard} isUnlocked={true} isAuth={true} onUnlock={() => {}} isStatic={true} hideButtons={true} />
              
              <div className="mt-8 space-y-4 relative z-20">
                 <button onClick={() => onViewProfile(proForCard)} className="w-full px-8 py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-[22px] font-bold text-base hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95">
                   <User size={20} /> {t('common.viewProfile')}
                 </button>
                 <button onClick={onEditProfile} className="w-full px-8 py-4 bg-black text-white rounded-[22px] font-bold text-base hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95">
                   <Edit3 size={20} /> {t('dashboard.modifyProfile')}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProHome;