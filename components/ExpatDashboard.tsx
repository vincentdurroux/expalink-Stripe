import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  Coins, 
  Search, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  Shield,
  MapPin,
  CheckCircle,
  Loader2,
  Briefcase,
  Repeat,
  ArrowLeft,
  Send,
  MessageSquareQuote,
  PenLine,
  X,
  Ghost,
  Globe,
  HelpCircle,
  ArrowUpRight,
  Clock,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { Professional, Review, UnlockToken, SearchFilters } from '../types';
import { POPULAR_CITIES, PROFESSION_CATEGORIES } from '../constants';
import { useTranslation } from 'react-i18next';
import ProfessionalCard from './ProfessionalCard';
import { CardSkeleton } from './Skeleton';
import { getUserProfile } from '../services/userService';

interface ExpatDashboardProps {
  credits: number;
  unlockedPros: Record<string, UnlockToken>;
  unlockedProfessionalList: Professional[];
  userReviews: Review[];
  preferredCity: string;
  onUpdateCity: (city: string) => void;
  onFindPros: () => void;
  onAddCredits: () => void;
  onMessagePro: (pro: Professional) => void;
  onSubmitReview: (proId: string, stars: number, testimonies: string, serviceType: string, isAnonymous: boolean) => Promise<void> | void;
  onSwitchToPro: () => void;
  onViewProfile: (pro: Professional) => void;
  onBack: () => void;
  onTriggerSearch: () => void;
  userCoords?: { lat: number, lng: number } | null;
}

const CategoryCarousel: React.FC<{ 
  pros: Professional[], 
  onViewProfile: (p: Professional) => void, 
  userCoords?: { lat: number, lng: number } | null,
  isLoading?: boolean
}> = ({ pros, onViewProfile, userCoords, isLoading = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [pros, isLoading]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = direction === 'left' ? -cardWidth * 0.8 : cardWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex overflow-x-auto no-scrollbar gap-4 md:gap-8 pb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="shrink-0 w-[85vw] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)]">
            <CardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  const isCarouselActive = pros.length > 3;

  return (
    <div className="relative group/results px-1 md:px-0">
      <div 
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-8 pb-4"
      >
        {pros.map(pro => (
          <div key={pro.id} className="snap-center shrink-0 w-[85vw] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.35rem)]">
            <ProfessionalCard 
              professional={pro} 
              isUnlocked={true} 
              isAuth={true} 
              onUnlock={() => {}} 
              onViewProfile={onViewProfile} 
              userCoords={userCoords}
            />
          </div>
        ))}
      </div>

      {canScrollLeft && isCarouselActive && (
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-full shadow-xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden lg:flex"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
      )}

      {canScrollRight && isCarouselActive && (
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-full shadow-xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden lg:flex"
        >
          <ChevronRight size={24} strokeWidth={2.5} />
        </button>
      )}
      
      <div className="lg:hidden">
        {canScrollRight && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none animate-pulse">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-100">
              <ChevronRight size={18} className="text-[#2e75c2]" />
            </div>
          </div>
        )}
        {canScrollLeft && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none animate-pulse">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-gray-100">
              <ChevronLeft size={18} className="text-[#2e75c2]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewCarousel: React.FC<{ reviews: Review[], t: any }> = ({ reviews, t }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
  }, [reviews]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.offsetWidth * 0.8;
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <div className="relative group/reviews px-1">
      <div 
        ref={scrollContainerRef}
        onScroll={updateScrollButtons}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-6 pb-6"
      >
        {reviews.map(review => (
          <div 
            key={review.id} 
            className={`snap-center shrink-0 w-[85vw] md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] apple-card p-5 md:p-8 border relative overflow-hidden group/card transition-all shadow-sm flex flex-col h-full min-h-[220px] md:min-h-[280px] ${
              review.status === 'rejected' ? 'bg-red-50/40 border-red-200 ring-2 ring-red-100' : 
              review.status === 'pending' ? 'bg-amber-50/10 border-amber-100' : 
              'bg-white border-gray-100 hover:border-indigo-100'
            }`}
          >
            <div className="flex flex-col gap-4 mb-auto">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="text-[9px] md:text-[10px] font-semibold uppercase tracking-widest text-gray-400 line-clamp-1">
                    {review.proName || t('common.expert')}
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= review.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-100'} />
                    ))}
                  </div>
                </div>
                <div className={`flex items-center justify-center p-1.5 rounded-full border shadow-sm ${
                  review.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  review.status === 'rejected' ? 'bg-red-600 text-white border-red-600' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                   {review.status === 'verified' ? <ShieldCheck size={14} /> : 
                    review.status === 'rejected' ? <AlertCircle size={14} /> : 
                    <Clock size={14} className="animate-pulse" />}
                </div>
              </div>
              <p className={`text-gray-700 italic text-sm md:text-base leading-relaxed font-medium line-clamp-4 md:line-clamp-5 ${review.status === 'rejected' ? 'line-through decoration-red-300 opacity-60' : ''}`}>
                "{review.testimonies}"
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="text-[8px] md:text-[9px] text-gray-400 font-semibold uppercase tracking-widest">
                {new Date(review.date).toLocaleDateString()}
              </div>
              {review.isAnonymous && (
                <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded text-[8px] font-semibold uppercase border border-gray-100">
                  {t('expatDashboard.reviews.anonymous')}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {canScrollLeft && reviews.length > 3 && (
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 rounded-full shadow-xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden md:flex"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
      )}

      {canScrollRight && reviews.length > 3 && (
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 rounded-full shadow-xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden md:flex"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

const ExpatDashboard: React.FC<ExpatDashboardProps> = ({ 
  credits, 
  unlockedPros, 
  unlockedProfessionalList,
  userReviews,
  preferredCity,
  onUpdateCity,
  onFindPros, 
  onAddCredits,
  onMessagePro,
  onSubmitReview,
  onSwitchToPro,
  onViewProfile,
  onBack,
  onTriggerSearch,
  userCoords
}) => {
  const { t } = useTranslation();
  const [selectedProForReview, setSelectedProForReview] = useState<Professional | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadyPro, setIsAlreadyPro] = useState(false);
  
  useEffect(() => {
    const checkProStatus = async () => {
       const { data: { user } } = await (await import('../supabaseClient')).supabase.auth.getUser();
       if (user) {
          const profile = await getUserProfile(user.id);
          setIsAlreadyPro(!!profile?.is_pro);
       }
    };
    checkProStatus();
  }, []);

  const isInitialLoadingPros = useMemo(() => {
    const expectedCount = Object.keys(unlockedPros).length;
    return expectedCount > 0 && unlockedProfessionalList.length === 0;
  }, [unlockedPros, unlockedProfessionalList]);

  const prosWaitingForReview = useMemo<Professional[]>(() => {
    const list = Array.isArray(unlockedProfessionalList) ? unlockedProfessionalList : [];
    const reviews = Array.isArray(userReviews) ? userReviews : [];

    return list.filter(pro => {
      const existingActiveReview = reviews.find(
        r => r.proId === pro.id && (r.status === 'verified' || r.status === 'pending')
      );
      return !existingActiveReview;
    });
  }, [unlockedProfessionalList, userReviews]);

  const REVIEW_WAITING_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

  const getReviewStatus = (proId: string) => {
    const unlockDate = unlockedPros[proId]?.unlockDate || 0;
    const now = Date.now();
    const diff = now - unlockDate;
    const isReady = diff >= REVIEW_WAITING_PERIOD_MS;
    const remainingDays = Math.ceil((REVIEW_WAITING_PERIOD_MS - diff) / (24 * 60 * 60 * 1000));
    
    return { isReady, remainingDays };
  };

  const groupedUnlockedPros = useMemo<Record<string, Professional[]>>(() => {
    const groups: Record<string, Professional[]> = {};
    const list = Array.isArray(unlockedProfessionalList) ? [...unlockedProfessionalList] : [];

    list.sort((a, b) => {
      const dateA = unlockedPros[a.id]?.unlockDate || 0;
      const dateB = unlockedPros[b.id]?.unlockDate || 0;
      return dateB - dateA;
    });

    list.forEach((pro: Professional) => {
      const mainProf = pro.professions?.[0];
      let categoryFound = 'other';
      if (mainProf) {
        for (const [catKey, profs] of Object.entries(PROFESSION_CATEGORIES)) {
          if ((profs as string[]).includes(mainProf)) {
            categoryFound = catKey;
            break;
          }
        }
      }
      if (!groups[categoryFound]) groups[categoryFound] = [];
      groups[categoryFound].push(pro);
    });
    return groups;
  }, [unlockedProfessionalList, unlockedPros]);

  const handleReviewClick = (pro: Professional) => {
    setSelectedProForReview(pro);
    setReviewRating(5);
    setReviewComment('');
    setIsAnonymous(false);
  };

  const submitReview = async () => {
    if (selectedProForReview && reviewComment.length >= 20 && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const serviceType = selectedProForReview.professions?.[0] || 'Expert';
        await onSubmitReview(selectedProForReview.id, reviewRating, reviewComment, serviceType, isAnonymous);
        setSelectedProForReview(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 animate-in fade-in duration-700 overflow-x-hidden">
      <button 
        onClick={onBack}
        className="mb-10 flex items-center justify-center md:justify-start gap-3 text-gray-400 hover:text-black transition-colors font-bold text-sm min-h-[48px] w-full md:w-auto"
      >
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start px-1">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-3">{t('expatDashboard.title')}</h1>
          <p className="text-gray-400 text-sm md:text-base font-medium leading-relaxed max-w-lg">{t('expatDashboard.subtitle')}</p>
        </div>
        
        <div className="apple-card p-6 flex items-center gap-5 border border-gray-100 w-full md:w-auto min-w-[240px] shadow-sm">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-500 shadow-inner">
            <Coins size={28} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-3xl font-bold text-gray-900">{credits}</div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t('expatDashboard.creditsLabel')}</div>
          </div>
          <button onClick={onAddCredits} className="p-4 bg-gray-50 hover:bg-amber-100 hover:text-amber-600 rounded-[18px] text-gray-400 transition-all active:scale-95 shadow-sm">
            <Zap size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-16">
        <div className="space-y-10">
           <div className="flex items-center gap-4 px-2">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-4">
                <ShieldCheck className="text-emerald-500" size={32} />
                {t('expatDashboard.unlockedTitle')}
              </h2>
              {Object.keys(unlockedPros).length > 0 && (
                 <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest shadow-sm">
                   {Object.keys(unlockedPros).length}
                 </span>
              )}
           </div>

           {isInitialLoadingPros ? (
              <div className="space-y-10">
                 <div className="space-y-6">
                    <div className="h-4 w-32 bg-gray-100 rounded-full animate-pulse ml-2" />
                    <CategoryCarousel pros={[]} onViewProfile={() => {}} isLoading={true} />
                 </div>
              </div>
           ) : unlockedProfessionalList && unlockedProfessionalList.length > 0 ? (
             <div className="space-y-12">
               {Object.entries(groupedUnlockedPros as Record<string, Professional[]>).map(([catKey, pros]) => (
                 <div key={catKey} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                      <div className="h-6 w-1.5 bg-indigo-500 rounded-full shadow-sm" />
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                        {catKey === 'other' ? t('common.other') : t(`search.categories.${catKey}`)}
                      </h3>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] font-bold text-gray-300">{pros.length}</span>
                    </div>
                    
                    <CategoryCarousel pros={pros} onViewProfile={onViewProfile} userCoords={userCoords} />
                 </div>
               ))}
             </div>
           ) : (
             <div className="apple-card p-20 text-center border-2 border-dashed border-gray-200 bg-gray-50/30 mx-1">
               <Search size={48} className="mx-auto text-gray-200 mb-6" />
               <h3 className="text-xl font-bold text-gray-900 mb-2">{t('expatDashboard.noExpertsTitle')}</h3>
               <p className="text-sm font-medium text-gray-400 mb-10">{t('expatDashboard.noExpertsDesc')}</p>
               <button onClick={onFindPros} className="bg-black text-white px-10 py-5 rounded-[22px] font-bold text-base hover:bg-gray-800 transition-all shadow-xl active:scale-95">{t('nav.findPro')}</button>
             </div>
           )}
        </div>

        <div className="space-y-10">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-4 px-2"><MessageSquareQuote className="text-amber-500" size={32} />{t('expatDashboard.reviews.sectionTitle')}</h2>
          
          {prosWaitingForReview.length > 0 && (
            <div className="space-y-5 px-1">
               <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 text-center md:text-left ml-1">{t('expatDashboard.reviews.waitingTitle')} ({prosWaitingForReview.length})</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                   {prosWaitingForReview.map(pro => {
                     const { isReady, remainingDays } = getReviewStatus(pro.id);
                     return (
                       <div key={pro.id} className={`apple-card p-6 border flex flex-col items-center gap-6 group shadow-sm transition-all ${isReady ? 'border-amber-100 bg-amber-50/20' : 'border-gray-100 bg-gray-50/30 opacity-80'}`}>
                          <div className="flex items-center gap-5 w-full">
                             <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 ${!isReady ? 'grayscale' : ''}`}>
                               <img src={pro.image} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className="text-left flex-1">
                                <div className="font-bold text-gray-900 leading-tight text-base">{pro.name}</div>
                                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{t(`professions.${pro.professions[0]}`)}</div>
                             </div>
                          </div>
                          
                          {isReady ? (
                            <button 
                              onClick={() => handleReviewClick(pro)} 
                              className="w-full bg-white text-amber-600 px-6 py-4 rounded-[18px] text-sm font-bold border-2 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95"
                            >
                              <PenLine size={18} /> {t('expatDashboard.reviews.evaluateBtn')}
                            </button>
                          ) : (
                            <div className="w-full py-4 px-6 rounded-[18px] bg-white/50 border border-gray-100 flex items-center justify-center gap-3 text-gray-400">
                               <Clock size={16} className="text-gray-300" />
                               <span className="text-[10px] font-bold uppercase tracking-widest">
                                 {t('expatDashboard.reviews.waitingPeriod', { days: remainingDays })}
                               </span>
                            </div>
                          )}
                       </div>
                     );
                   })}
               </div>
            </div>
          )}

          {userReviews && userReviews.length > 0 ? (
            <div className="space-y-6 pt-4 px-1">
               <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 text-center md:text-left ml-1 mb-4">{t('expatDashboard.reviews.historyTitle')} ({userReviews.length})</h3>
               <ReviewCarousel reviews={userReviews} t={t} />
            </div>
          ) : prosWaitingForReview.length === 0 && (
            <div className="apple-card p-20 text-center border-2 border-dashed border-gray-200 bg-gray-50/30 mx-1">
               <MessageSquareQuote size={48} className="mx-auto text-gray-200 mb-6" />
               <p className="text-sm font-semibold text-gray-400 uppercase tracking-[0.2em]">{t('expatDashboard.reviews.empty')}</p>
            </div>
          )}
        </div>
      </div>

      {/* TOOLS & HELP AT THE BOTTOM */}
      <div className="mt-24 pt-16 border-t border-gray-100 px-1">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <div className="apple-card p-8 border border-gray-100 bg-white shadow-sm flex flex-col">
              <h3 className="text-[10px] font-semibold uppercase text-gray-400 tracking-[0.2em] mb-8 px-1">{t('expatDashboard.toolsTitle')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                 <button onClick={onFindPros} className="w-full flex items-center gap-4 p-5 rounded-[22px] bg-indigo-50/30 text-indigo-600 hover:bg-indigo-50 border border-indigo-100/50 transition-all group active:scale-[0.98]">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"><Search size={20} /></div>
                    <div className="text-left flex-1">
                       <div className="text-sm font-bold leading-none mb-1">{t('nav.findPro')}</div>
                       <div className="text-[10px] font-medium text-indigo-400/80 uppercase tracking-tight">{t('expatDashboard.accessDirectory')}</div>
                    </div>
                    <ChevronRight size={16} className="text-indigo-300" />
                 </button>

                 <div className="w-full flex items-center gap-4 p-5 rounded-[22px] bg-gray-50/50 text-gray-900 border border-gray-100 transition-all group opacity-60 cursor-not-allowed">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"><HelpCircle size={20} className="text-gray-400" /></div>
                    <div className="text-left flex-1">
                       <div className="text-sm font-bold leading-none mb-1">{t('expatDashboard.support')}</div>
                       <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{t('subscription.comingSoon')}</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-gray-900 rounded-[36px] p-8 md:p-10 text-center relative overflow-hidden group shadow-xl flex items-center">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4"><Briefcase size={80} className="text-white" /></div>
              <div className="relative z-10 w-full flex flex-col sm:flex-row items-center gap-8">
                 <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse shrink-0"><Zap size={24} fill="currentColor" /></div>
                 <div className="text-left flex-1">
                    <h4 className="text-white text-xl font-bold mb-2 leading-tight">
                      {isAlreadyPro ? t('expatDashboard.proInvite.titlePro') : t('expatDashboard.proInvite.titleExpat')}
                    </h4>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed">
                      {isAlreadyPro ? t('expatDashboard.proInvite.descPro') : t('expatDashboard.proInvite.descExpat')}
                    </p>
                 </div>
                 <button onClick={onSwitchToPro} className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 shrink-0">
                   <Repeat size={16} /> {isAlreadyPro ? t('expatDashboard.proInvite.btnPro') : t('expatDashboard.proInvite.btnExpat')}
                 </button>
              </div>
           </div>
         </div>
      </div>

      {selectedProForReview && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-2 md:p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="relative w-full max-w-lg bg-white rounded-[28px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[95vh]">
              
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-emerald-100 shrink-0">
                      <img src={selectedProForReview?.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-none">{t('expatDashboard.reviews.modalTitle')}</h3>
                      <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{selectedProForReview?.name}</p>
                    </div>
                 </div>
                 <button onClick={() => !isSubmitting && setSelectedProForReview(null)} className="p-1.5 text-gray-300 hover:text-black transition-all" disabled={isSubmitting}>
                   <X size={20} />
                 </button>
              </div>

              <div className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-hidden">
                 <div className="flex flex-col items-center gap-1">
                    <label className="text-[8px] font-semibold uppercase tracking-widest text-gray-300">{t('expatDashboard.reviews.ratingLabel')}</label>
                    <div className="flex justify-center gap-2">
                       {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => star <= 5 && !isSubmitting && setReviewRating(star)} className="transition-all active:scale-90 hover:scale-105" disabled={isSubmitting}>
                             <Star size={28} className={`${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-100'} transition-colors duration-150`} strokeWidth={star <= reviewRating ? 0 : 2} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-[8px] font-semibold uppercase tracking-widest text-gray-300">{t('expatDashboard.reviews.commentLabel')}</label>
                       <span className={`text-[7px] font-semibold uppercase px-1.5 py-0.5 rounded ${reviewComment.length < 20 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>{reviewComment.length}/20 {t('forms.minChars')}</span>
                    </div>
                    <textarea 
                      value={reviewComment} 
                      onChange={e => setReviewComment(e.target.value)} 
                      className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-100 rounded-2xl p-3 md:p-4 text-sm font-medium outline-none focus:bg-white transition-all h-20 md:h-24 resize-none shadow-inner leading-relaxed" 
                      placeholder={t('expatDashboard.reviews.placeholder')} 
                      disabled={isSubmitting} 
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isAnonymous ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                      <div className="flex items-center gap-2">
                        {isAnonymous ? <Ghost size={14} /> : <User size={14} />}
                        <span className="text-[11px] font-bold">{t('expatDashboard.reviews.anonymous')}</span>
                      </div>
                      <div className={`w-6 h-3 rounded-full relative transition-colors ${isAnonymous ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                         <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${isAnonymous ? 'right-0.5' : 'left-0.5'}`} />
                      </div>
                    </button>

                    <div className="flex items-center gap-2 p-2.5 bg-indigo-50/20 rounded-xl border border-indigo-50">
                       <Shield size={14} className="text-indigo-400 shrink-0" />
                       <p className="text-[7px] font-bold text-indigo-600/70 leading-tight uppercase tracking-tighter">{t('expatDashboard.reviews.manualVerification')}</p>
                    </div>
                 </div>

                 <button 
                  disabled={reviewComment.length < 20 || isSubmitting} 
                  onClick={submitReview} 
                  className="w-full bg-black text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} />{t('expatDashboard.reviews.submitBtn')}</>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpatDashboard;