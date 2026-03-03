import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Eye, Unlock, Star, ShieldCheck, Zap, Sparkles, X, Info, CreditCard, RefreshCw, Edit3, MapPin, Globe, ArrowLeft, Briefcase, Repeat, Clock, CheckCircle2, ShieldAlert, FileCheck, Signal, SignalLow, PieChart, ArrowUpRight, Camera, FileUp, Trophy, AlertCircle, Loader2, XCircle, User, MessageSquareQuote, Ghost, Lock, Power, ShieldOff, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Professional, UserType, Review } from '../types';
import ProProfileForm from './ProProfileForm';
// Removed non-existent export updateProfileVisibility
import { getProStats, uploadVerificationDocs, mapDBRowToPro, getProfessionalReviews } from '../services/userService';
import VerificationBanner from './VerificationBanner';
import ConfirmationModal from './ConfirmationModal';

interface ProfessionalDashboardProps {
  profile: any; 
  currentPlan?: string | null; 
  planStatus?: 'active' | 'cancelling' | null; 
  subscriptionEndsAt?: string | null; 
  cancelAtPeriodEnd?: boolean; 
  onUpgradeClick?: () => void; 
  onCancelPlan?: () => Promise<void>; 
  onReactivatePlan?: () => Promise<void>; 
  onUpdateFeatured?: (status: boolean) => Promise<void>;
  onBack?: () => void; 
  onUpdateComplete?: (data: any) => Promise<void>; 
  onUpdateProfile?: (data: any) => Promise<void>; 
  onSwitchRole?: (targetRole: UserType, e?: React.MouseEvent) => void; 
  onViewProfile: (pro: Professional) => void;
  initialEditMode?: boolean;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ 
  profile: initialProfile, 
  currentPlan: directPlan, 
  planStatus: directStatus,
  subscriptionEndsAt: directExpiration, 
  cancelAtPeriodEnd: directCancelAtEnd, 
  onUpgradeClick, 
  onCancelPlan, 
  onReactivatePlan, 
  onUpdateFeatured,
  onBack, 
  onUpdateComplete, 
  onUpdateProfile, 
  onSwitchRole, 
  onViewProfile,
  initialEditMode = false
}) => {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isUploading, setIsUploading] = useState(false);
  const [showCancelFeaturedConfirm, setShowCancelFeaturedConfirm] = useState(false);
  const [showCancelPlanConfirm, setShowCancelPlanConfirm] = useState(false);
  const [isUpdatingFeatured, setIsUpdatingFeatured] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    setIsEditing(initialEditMode);
  }, [initialEditMode]);

  const normalizedPlanKey = useMemo(() => {
    const p = (directPlan || profile?.pro_plan || '').toLowerCase();
    if (!p) return null;
    if (p.includes('early') || p.includes('founding')) return 'early';
    if (p.includes('monthly')) return 'monthly';
    if (p.includes('elite') || p.includes('annual')) return 'elite';
    return p;
  }, [directPlan, profile?.pro_plan]);

  const planThemeClasses = useMemo(() => {
    switch (normalizedPlanKey) {
      case 'early': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'monthly': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'elite': return 'bg-violet-100 text-violet-700 border-violet-200';
      default: return 'bg-gray-100 text-gray-500 border-transparent';
    }
  }, [normalizedPlanKey]);

  // Nouveau : Thème pour l'icône du plan
  const planIconThemeClasses = useMemo(() => {
    switch (normalizedPlanKey) {
      case 'early': return 'bg-blue-50 text-blue-600';
      case 'monthly': return 'bg-orange-50 text-orange-600';
      case 'elite': return 'bg-violet-100 text-violet-700';
      default: return 'bg-emerald-50 text-emerald-600'; // Default legacy color
    }
  }, [normalizedPlanKey]);

  const expirationDate = directExpiration || profile?.subscription_ends_at;
  const isFeatured = !!profile?.is_featured;
  const isElite = normalizedPlanKey === 'elite';
  const isEarly = normalizedPlanKey === 'early';
  const planStatus = directStatus || profile?.plan_status;
  const cancelAtPeriodEnd = directCancelAtEnd ?? profile?.cancel_at_period_end;

  const formattedExpirationDate = useMemo(() => {
    if (!expirationDate) return '';
    try {
      return new Date(expirationDate).toLocaleDateString(i18n.language, {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return new Date(expirationDate).toLocaleDateString();
    }
  }, [expirationDate, i18n.language]);

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

  const handleOpenReviews = async () => {
    if (!profile?.id) return;
    setShowReviewsModal(true);
    setIsLoadingReviews(true);
    try {
      const res = await getProfessionalReviews(profile.id, profile.id);
      setReviews(res);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const stats = useMemo(() => [
    { id: 'rating', label: t('dashboard.stats.rating'), value: (profile?.reviews_count || 0) > 0 ? (profile?.rating || 5.0).toFixed(1) : t('common.noReviewsYet'), icon: <Star size={16} />, color: 'text-amber-600', bg: 'bg-amber-50', isClickable: true },
    { id: 'score', label: t('dashboard.completion.label'), value: `${completionPercentage}%`, icon: <PieChart size={16} />, color: 'text-indigo-600', bg: 'bg-indigo-50', isScore: true },
  ], [profile, completionPercentage, t, i18n.language]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !profile?.id) return;
    const files = Array.from(e.target.files) as File[];
    if (files.length > 3) {
      setUploadError(t('dashboard.verification.section.errorLimit'));
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      await uploadVerificationDocs(profile.id, files);
      if (onUpdateProfile) await onUpdateProfile({ verification_status: 'pending' });
    } catch (err) {
      setUploadError(t('dashboard.verification.section.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmCancelPlan = async () => {
    if (onCancelPlan) await onCancelPlan();
    setShowCancelPlanConfirm(false);
  };

  if (isEditing) return <ProProfileForm initialData={mapDBRowToPro(profile)} onComplete={async (d) => { if(onUpdateComplete) await onUpdateComplete(d); setIsEditing(false); }} onCancel={onBack} />;

  const verificationStatus = profile?.verification_status || 'none';
  const bioStatus = profile?.bio_verification_status || 'pending';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 animate-in fade-in overflow-x-hidden">
      {onBack && <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-black font-semibold text-[10px] uppercase tracking-widest min-h-[44px]"><ArrowLeft size={16} /> {t('common.back')}</button>}
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-2">{t('dashboard.proTitle')}</h1>
          <p className="text-gray-500 text-sm md:text-base font-medium">{t('dashboard.proSubtitle')}</p>
        </div>
        
        {bioStatus === 'approved' ? (
          <div className={`px-6 py-3 rounded-2xl flex items-center gap-4 border shadow-sm transition-all ${profile?.is_profile_online ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
            {profile?.is_profile_online ? <Signal size={20} className="animate-pulse" /> : <SignalLow size={20} />}
            <div className="text-left">
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">{t('dashboard.visibility.label')}</div>
              <div className="text-xs font-bold flex items-center gap-2">
                {profile?.is_profile_online ? t('dashboard.visibility.online') : t('dashboard.visibility.masked')}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 rounded-2xl flex items-center gap-4 border bg-gray-50 border-gray-100 text-gray-400 opacity-60 cursor-not-allowed grayscale">
            <ShieldOff size={20} />
            <div className="text-left">
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] leading-none mb-1">{t('dashboard.visibility.label')}</div>
              <div className="text-xs font-bold flex items-center gap-2 italic">
                {!profile?.is_pro_complete 
                  ? t('dashboard.visibility.notCreated') 
                  : (bioStatus === 'pending' ? t('dashboard.visibility.pendingBio') : t('dashboard.visibility.rejectedBio'))}
              </div>
            </div>
          </div>
        )}
      </div>

      <VerificationBanner status={verificationStatus} onAction={() => document.getElementById('verification-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />

      <div className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 mb-10">
        {stats.map((stat, i) => (
          <div key={i} onClick={() => { if (stat.isScore) setIsEditing(true); else if (stat.isClickable) handleOpenReviews(); }} className={`snap-center shrink-0 w-[65vw] sm:w-[280px] md:w-auto apple-card p-5 border border-gray-100 flex flex-col justify-between transition-all ${stat.isScore || stat.isClickable ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : ''} bg-white`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center shadow-sm`}>{stat.icon}</div>
              {stat.isClickable && <ArrowUpRight size={14} className="text-gray-300" />}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5 truncate">{stat.value}</div>
              <div className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="apple-card border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                {/* Icône du plan mise à jour pour prendre la couleur du plan */}
                <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner ${planIconThemeClasses}`}><CreditCard size={28} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{t('dashboard.plan.title')}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-semibold border uppercase tracking-widest transition-colors ${planThemeClasses}`}>
                      {normalizedPlanKey ? (t(`subscription.plans.${normalizedPlanKey}.name`) === `subscription.plans.${normalizedPlanKey}.name` ? normalizedPlanKey : t(`subscription.plans.${normalizedPlanKey}.name`)) : t('dashboard.plan.none')}
                    </span>
                    {normalizedPlanKey && expirationDate && (
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${cancelAtPeriodEnd ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        <Clock size={12} />
                        <span className="text-[9px] font-semibold uppercase tracking-tight">
                          {t('dashboard.plan.expires', { date: formattedExpirationDate })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-3">
                {cancelAtPeriodEnd ? (
                  <button onClick={onReactivatePlan} className="bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                    <RefreshCw size={18} /> {t('dashboard.plan.reactivate')}
                  </button>
                ) : normalizedPlanKey ? (
                  <button onClick={() => setShowCancelPlanConfirm(true)} className="bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95">
                    {t('dashboard.plan.cancel')}
                  </button>
                ) : null}
                <button onClick={onUpgradeClick} className="bg-black text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all shadow-xl active:scale-95">
                  {normalizedPlanKey ? t('dashboard.plan.manage') : t('dashboard.plan.view')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="apple-card border border-gray-100 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8">{t('proHome.badgesSection.title')}</h3>
            <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { id: 'f', icon: <Trophy size={24} />, label: t('proHome.badgesSection.early'), earned: normalizedPlanKey === 'early', color: 'text-blue-500', bg: 'bg-blue-50' },
                { id: 'v', icon: <ShieldCheck size={24} />, label: t('proHome.badgesSection.verified'), earned: verificationStatus === 'verified', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { id: 'r', icon: <Sparkles size={24} />, label: t('proHome.badgesSection.featured'), earned: isFeatured || isElite, color: 'text-violet-500', bg: 'bg-violet-50' }
              ].map(b => (
                <div key={b.id} className={`snap-center shrink-0 w-[70vw] sm:w-[240px] md:w-auto p-5 rounded-[28px] border-2 flex items-center gap-4 transition-all ${b.earned ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-40 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner ${b.bg} ${b.color}`}>{b.icon}</div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-gray-900 leading-tight truncate">{b.label}</span>
                    <span className="text-[9px] font-semibold uppercase text-gray-400 tracking-widest mt-0.5">{b.earned ? t('proHome.badgesSection.earnedTag') : t('proHome.badgesSection.lockedTag')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION VÉRIFICATION DOCUMENTS - UTILISATION EXCLUSIVE DE t() */}
          <div 
            id="verification-section" 
            className={`apple-card border p-8 shadow-sm transition-all duration-500 ${
              verificationStatus === 'verified' ? 'bg-emerald-50/20 border-emerald-100' :
              verificationStatus === 'rejected' ? 'bg-red-50/20 border-red-100' :
              verificationStatus === 'pending' ? 'bg-amber-50/30 border-amber-100' : 
              'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${
                verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                verificationStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                verificationStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 
                'bg-indigo-50 text-indigo-600'
              }`}>
                {verificationStatus === 'verified' ? <CheckCircle2 size={24} /> : 
                 verificationStatus === 'rejected' ? <XCircle size={24} /> :
                 <FileCheck size={24} />}
              </div>
              <div>
                <h3 className={`text-lg font-bold transition-colors ${
                  verificationStatus === 'verified' ? 'text-emerald-900' :
                  verificationStatus === 'rejected' ? 'text-red-900' :
                  verificationStatus === 'pending' ? 'text-amber-900' : 
                  'text-gray-900'
                }`}>
                  {t('dashboard.verification.section.title')}
                </h3>
                <p className={`text-xs font-medium transition-colors ${
                  verificationStatus === 'verified' ? 'text-emerald-700/60' :
                  verificationStatus === 'rejected' ? 'text-red-700/60' :
                  verificationStatus === 'pending' ? 'text-amber-700/60' : 
                  'text-gray-400'
                }`}>
                  {t('dashboard.verification.section.subtitle')}
                </p>
              </div>
            </div>

            <div className={`p-6 md:p-8 border-2 border-dashed rounded-[32px] flex flex-col items-center text-center transition-colors ${
              verificationStatus === 'verified' ? 'bg-white/50 border-emerald-200' :
              verificationStatus === 'rejected' ? 'bg-white/50 border-red-200' :
              verificationStatus === 'pending' ? 'bg-white/50 border-amber-200' : 
              'bg-gray-50/30 border-gray-100'
            }`}>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-sm transition-colors ${
                verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-300' :
                verificationStatus === 'rejected' ? 'bg-red-50 text-red-300' :
                verificationStatus === 'pending' ? 'bg-amber-50 text-amber-300' : 
                'bg-white text-gray-300'
              }`}>
                <FileUp size={32} />
              </div>
              
              <div className="max-w-sm mb-8">
                <p className={`text-sm font-bold mb-2 ${
                  verificationStatus === 'verified' ? 'text-emerald-900' :
                  verificationStatus === 'rejected' ? 'text-red-900' :
                  verificationStatus === 'pending' ? 'text-amber-900' : 
                  'text-gray-900'
                }`}>
                  {verificationStatus === 'verified' ? t('dashboard.verification.banner.verified') : 
                   verificationStatus === 'rejected' ? t('dashboard.verification.banner.rejected') :
                   verificationStatus === 'pending' ? t('dashboard.verification.banner.pending') : 
                   t('dashboard.verification.section.uploadBtn')}
                </p>
                <p className={`text-[11px] font-medium leading-relaxed ${
                  verificationStatus === 'verified' ? 'text-emerald-800/60' :
                  verificationStatus === 'rejected' ? 'text-red-800/60' :
                  verificationStatus === 'pending' ? 'text-amber-800/60' : 
                  'text-gray-400'
                }`}>
                  {t('dashboard.verification.section.support')}
                </p>
              </div>

              {uploadError && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle size={14} /> {uploadError}
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`px-10 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-3 shadow-xl active:scale-95 ${
                  verificationStatus === 'verified' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50' :
                  verificationStatus === 'rejected' ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200/50' :
                  verificationStatus === 'pending' ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200/50' :
                  'bg-black text-white hover:bg-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><Camera size={18} /> {verificationStatus === 'none' ? t('dashboard.verification.section.uploadBtn') : t('dashboard.verification.section.editBtn')}</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showReviewsModal && (
        <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center p-0 md:p-6 transition-all animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowReviewsModal(false)} />
          <div className="relative w-full max-w-2xl h-[90vh] md:h-auto md:max-h-[85vh] bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-50 bg-white sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner"><MessageSquareQuote size={24} /></div>
                <div><h3 className="text-xl font-bold text-gray-900 leading-tight">{t('common.reviews')}</h3><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{reviews.length} {t('expatHome.expertsOnSite').toLowerCase()}</p></div>
              </div>
              <button onClick={() => setShowReviewsModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-full transition-all active:scale-90"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-6">
              {isLoadingReviews ? <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-indigo-500" size={40} /><p className="text-xs font-semibold text-gray-300 uppercase tracking-[0.2em]">{t('admin.loading')}</p></div> : reviews.length > 0 ? reviews.map(review => (
                <div key={review.id} className={`p-6 bg-white rounded-[32px] border shadow-sm relative overflow-hidden group transition-all hover:border-amber-100 ${review.status === 'rejected' ? 'border-red-200 bg-red-50/20' : review.status === 'pending' ? 'border-amber-50 bg-amber-50/5' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-col gap-1"><div className={`text-xs font-bold text-gray-900 ${review.isAnonymous ? 'flex items-center gap-2' : ''}`}>{review.isAnonymous && <Ghost size={12} className="text-gray-300" />}{review.isAnonymous ? t('common.anonymousExpat') : review.userName}</div><div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= review.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-100'} />)}</div></div>
                    <div className="flex flex-col items-end gap-2"><div className={`w-9 h-9 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center`}>{review.isAnonymous ? <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><Ghost size={16} /></div> : review.userAvatar ? <img src={review.userAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><User size={16} /></div>}</div><span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</span></div>
                  </div>
                  <p className={`text-gray-700 text-sm md:text-base leading-relaxed italic font-medium ${review.status === 'rejected' ? 'opacity-50' : ''}`}>"{review.testimonies}"</p>
                </div>
              )) : <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100"><MessageSquareQuote size={48} className="mx-auto text-gray-200 mb-6" /><p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.2em]">{t('common.noReviewsYet')}</p></div>}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={showCancelFeaturedConfirm} onClose={() => setShowCancelFeaturedConfirm(false)} onConfirm={async () => { if(onUpdateFeatured) await onUpdateFeatured(false); setShowCancelFeaturedConfirm(false); }} title={t('subscription.confirmCancelTitle')} message={t('subscription.featuredBadge.cancelConfirm')} confirmLabel={t('common.confirm')} type="expat" />
      
      <ConfirmationModal 
        isOpen={showCancelPlanConfirm} 
        onClose={() => setShowCancelPlanConfirm(false)} 
        onConfirm={handleConfirmCancelPlan} 
        title={normalizedPlanKey === 'early' ? t('subscription.confirmCancelFoundingTitle') : t('subscription.confirmCancelTitle')} 
        message={normalizedPlanKey === 'early' ? t('subscription.confirmCancelFoundingMsg') : t('subscription.confirmCancelMsg')} 
        confirmLabel={t('dashboard.plan.cancel')} 
        type="pro" 
      />
    </div>
  );
};

export default ProfessionalDashboard;