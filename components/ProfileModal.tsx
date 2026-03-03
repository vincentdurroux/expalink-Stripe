import { X, MapPin, Phone, Mail, ShieldCheck, Star, Lock, Coins, User, Building2, Globe, ExternalLink, Navigation, Award, Briefcase, GraduationCap, Sparkles, Loader2, MessageSquareQuote, Ghost, Clock, User2, Languages, ChevronLeft, ChevronRight, LogIn, MessageCircle, Calendar } from 'lucide-react';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Professional, Review } from '../types';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_FLAGS, getFlagEmoji, SPANISH_CITY_DATA } from '../constants';
import { getProfessionalReviews, calculateHaversineDistance, fetchProDetails } from '../services/userService';
import { getBookingPlatform } from './ProfessionalCard';

const ProfileReviewCarousel: React.FC<{ reviews: Review[], t: any, isBlurred?: boolean }> = ({ reviews, t, isBlurred = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [reviews]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/carousel">
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 px-1"
      >
        {reviews.map((review) => (
          <div key={review.id} className="snap-center shrink-0 w-[calc(80%-0.5rem)] md:w-[calc(50%-0.5rem)] p-4 md:p-6 bg-white rounded-[24px] border border-gray-100 shadow-sm group hover:border-amber-100 transition-all flex flex-col h-full min-h-[160px] md:min-h-[200px]">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 overflow-hidden shadow-inner">
                  {review.isAnonymous ? <Ghost size={14} /> : (review.userAvatar ? <img src={review.userAvatar} className="w-full h-full object-cover" /> : <User size={14} />)}
                </div>
                <div className="text-[10px] font-bold text-gray-900 truncate">
                  {review.isAnonymous ? t('common.anonymousExpat') : review.userName}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                {[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= review.stars ? 'fill-amber-400 text-amber-400' : 'text-gray-100'} />)}
              </div>
            </div>
            <p className={`text-[10px] md:text-xs text-gray-500 italic leading-relaxed line-clamp-4 md:line-clamp-6 flex-1 transition-all ${isBlurred ? 'blur-[5px] opacity-40 select-none pointer-events-none grayscale' : ''}`}>
              "{review.testimonies}"
            </p>
            <div className="mt-3 text-[7px] font-bold text-gray-300 uppercase tracking-widest">{new Date(review.date).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
      
      {canScrollLeft && (
        <button onClick={() => scroll('left')} className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-xl border border-gray-100 p-2 md:p-3 rounded-full text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden sm:flex">
          <ChevronLeft size={18} />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll('right')} className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-xl border border-gray-100 p-2 md:p-3 rounded-full text-indigo-600 hover:scale-110 active:scale-90 transition-all hidden sm:flex">
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

interface ProfileModalProps {
  pro: Professional; 
  isUnlocked: boolean; 
  isAuth: boolean; 
  isOwner?: boolean; 
  isPremium?: boolean;
  currentUserId?: string;
  onClose: () => void; 
  onUnlock: (id: string, e: React.MouseEvent) => void;
  userCoords?: { lat: number, lng: number } | null;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ pro, isUnlocked, isAuth, isOwner, isPremium = false, currentUserId, onClose, onUnlock, userCoords }) => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [localPro, setLocalPro] = useState<Professional>(pro);

  const currentLangCode = i18n.language ? i18n.language.split('-')[0] : 'en';

  useEffect(() => {
    const loadData = async () => {
      setLoadingDetails(true);
      try {
        const details = await fetchProDetails(pro.id, true);
        if (details) {
          setLocalPro(prev => ({ ...prev, ...details }));
        }
      } catch (err) {
        console.warn("Details loading failed", err);
      } finally {
        setLoadingDetails(false);
      }

      setLoadingReviews(true);
      try {
        const res = await getProfessionalReviews(pro.id, currentUserId);
        res.sort((a, b) => b.date - a.date);
        setReviews(res);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    loadData();
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [pro.id, isUnlocked, isOwner, currentUserId]);

  const handleClose = () => { 
    setIsVisible(false); 
    setTimeout(onClose, 400); 
  };

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onUnlock(pro.id, e);
  };

  const canSeePrivateData = isUnlocked || isOwner || isPremium;
  const currentPro = localPro; 
  
  const safeName = currentPro.name || t('common.expert');
  
  const displayName = useMemo(() => {
    if (canSeePrivateData) return safeName;
    return (
      <span className="blur-[12px] select-none opacity-40">
        {safeName}
      </span>
    );
  }, [safeName, canSeePrivateData]);

  const isVerified = currentPro.verified || currentPro.verificationStatus === 'verified';
  const isEarly = !!currentPro.isEarlyMember;
  const isFeatured = !!currentPro.isFeatured;

  const platform = useMemo(() => getBookingPlatform(currentPro.bookingUrl || ''), [currentPro.bookingUrl]);

  // LOGIQUE DE BIO TRADUITE
  const isUsingTranslation = useMemo(() => {
    return !!(currentPro.bios && currentPro.bios[currentLangCode]);
  }, [currentPro.bios, currentLangCode]);

  const displayBio = useMemo(() => {
    if (loadingDetails) return "...";
    if (isUsingTranslation) return currentPro.bios![currentLangCode];
    return currentPro.bio || "";
  }, [currentPro.bios, currentPro.bio, currentLangCode, loadingDetails, isUsingTranslation]);

  const distanceStr = useMemo(() => {
    let dist = currentPro.distance_km;
    if ((dist === null || dist === undefined) && userCoords) {
      if (currentPro.latitude && currentPro.longitude) {
        dist = calculateHaversineDistance(userCoords.lat, userCoords.lng, currentPro.latitude, currentPro.longitude);
      }
    }
    if (!dist || dist >= 9990) return '';
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  }, [currentPro.distance_km, currentPro.latitude, currentPro.longitude, userCoords]);

  const getSpecialtyLabel = (s: string) => {
    if (currentPro.specialtyTranslations?.[currentLangCode]?.[s]) {
      return currentPro.specialtyTranslations[currentLangCode][s];
    }
    const key = `specialties.${s}`;
    const translated = t(key);
    return translated === key ? s : translated;
  };

  const blurClass = "blur-[5px] opacity-40 select-none pointer-events-none grayscale";

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-6 transition-all duration-400 ease-out" style={{ opacity: isVisible ? 1 : 0 }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] bg-white rounded-none md:rounded-[40px] shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] transform" style={{ transform: isVisible ? 'translateY(0)' : 'translateY(100%)' }}>
        <button onClick={handleClose} className="absolute top-6 right-6 z-[110] p-2.5 bg-gray-100/90 text-gray-500 hover:text-black rounded-full shadow-lg border border-white/50 backdrop-blur-md transition-all active:scale-90"><X size={24} /></button>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 pb-32">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] overflow-hidden ring-8 ring-gray-50 shadow-xl bg-gray-100 shrink-0">
              {currentPro.image ? (
                <img src={currentPro.image} className={`w-full h-full object-cover transition-all ${!canSeePrivateData ? 'blur-lg opacity-60 grayscale' : ''}`} alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-gray-200">
                  <User2 size={64} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 mb-4">
                {isFeatured && <span className="bg-violet-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"><Sparkles size={10} fill="currentColor" /> {t('common.featuredBadge')}</span>}
                {isVerified && <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"><ShieldCheck size={10} /> {t('common.verified')}</span>}
                {isEarly && <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"><Award size={10} /> {t('dashboard.badges.early')}</span>}
                {distanceStr && <span className="bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase flex items-center gap-1.5 shadow-sm"><Navigation size={10} fill="currentColor" /> {distanceStr}</span>}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-2">{displayName}</h2>
              <div className="flex flex-col items-center md:items-start gap-3">
                {Number(currentPro.reviews) > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100 shadow-sm w-fit transition-all">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-gray-900">{(currentPro.rating || 5.0).toFixed(1)}</span>
                    <span className="text-[10px] font-semibold text-amber-600/70">({currentPro.reviews})</span>
                  </div>
                )}
                <div className="flex flex-col items-center md:items-start gap-2">
                  <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] md:text-sm font-bold uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                    <Briefcase size={14} />
                    <span>{currentPro.professions?.[0] ? t(`professions.${currentPro.professions[0]}`) : t('common.expert')}</span>
                  </div>
                  {currentPro.websiteUrl && (
                    canSeePrivateData ? (
                      <a 
                        href={currentPro.websiteUrl.startsWith('http') ? currentPro.websiteUrl : `https://${currentPro.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 text-[10px] md:text-xs font-bold transition-all hover:underline group/web"
                      >
                        <Globe size={14} className="group-hover/web:rotate-12 transition-transform" />
                        <span className="truncate max-w-[200px]">{currentPro.websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        <ExternalLink size={10} className="opacity-40" />
                      </a>
                    ) : (
                      <div className={`flex items-center gap-1.5 text-blue-600 text-[10px] md:text-xs font-bold transition-all ${blurClass}`}>
                        <Globe size={14} />
                        <span className="truncate max-w-[200px]">••••••••••••••••</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {/* RÉSERVATION DYNAMIQUE - MÊME TAILLE QUE LES AUTRES */}
            {currentPro.bookingUrl && canSeePrivateData && platform && (
              <div 
                onClick={() => window.open(currentPro.bookingUrl, '_blank')}
                className={`flex items-center gap-4 p-4 ${platform.color} rounded-[24px] hover:brightness-110 shadow-lg transition-all cursor-pointer group/bk animate-in slide-in-from-left-2`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover/bk:scale-110 transition-transform"><Calendar size={18} /></div>
                <div className="flex-1 overflow-hidden text-white">
                  <div className="text-[9px] font-bold text-white/70 uppercase tracking-widest leading-none mb-1">
                    {platform.name || t('booking.label')}
                  </div>
                  <div className="text-sm font-black truncate">
                    {platform.name ? t('booking.btnWithPlatform', { name: platform.name }) : t('booking.btn')}
                  </div>
                </div>
                <ExternalLink size={14} className="text-white/40" />
              </div>
            )}

            {currentPro.whatsapp_number ? (
               canSeePrivateData ? (
                 <a 
                  href={`https://wa.me/${currentPro.whatsapp_number.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-4 p-4 bg-emerald-50 rounded-[24px] border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 shadow-sm transition-all group/wa animate-in slide-in-from-left-2"
                 >
                   <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg group-hover/wa:scale-110 transition-transform"><MessageCircle size={18} fill="currentColor" /></div>
                   <div className="flex-1 overflow-hidden">
                     <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">WhatsApp</div>
                     <div className="text-sm font-bold text-gray-900 truncate">{currentPro.whatsapp_number}</div>
                   </div>
                   <ExternalLink size={14} className="text-emerald-300" />
                 </a>
               ) : (
                 <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 transition-all ${isAuth ? 'opacity-50' : blurClass}`}>
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm shrink-0"><MessageCircle size={18} fill="currentColor" /></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">WhatsApp</div>
                      <div className="text-sm font-bold text-gray-900 truncate opacity-40">••••••••••</div>
                    </div>
                  </div>
               )
            ) : null}

            {/* LOGIQUE : On affiche le téléphone SEULEMENT si WhatsApp n'est pas disponible */}
            {!currentPro.whatsapp_number && (
              <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 transition-all ${!canSeePrivateData ? (isAuth ? 'opacity-50' : blurClass) : 'hover:bg-white hover:border-indigo-100 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0"><Phone size={18} /></div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{t('forms.phoneMain')}</div>
                  {canSeePrivateData ? (
                    <a href={`tel:${currentPro.phone}`} className="text-sm font-bold text-gray-900 truncate block">{currentPro.phone || t('common.notSpecified')}</a>
                  ) : (
                    <div className="text-sm font-bold text-gray-900 truncate opacity-40">••••••••••</div>
                  )}
                </div>
              </div>
            )}

            {currentPro.email_pro && (
              <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 transition-all ${!canSeePrivateData ? (isAuth ? 'opacity-50' : blurClass) : 'hover:bg-white hover:border-indigo-100 shadow-sm'}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0"><Mail size={18} /></div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{t('forms.emailPro')}</div>
                  {canSeePrivateData ? (
                    <a href={`mailto:${currentPro.email_pro}`} className="text-sm font-bold text-gray-900 truncate block">{currentPro.email_pro}</a>
                  ) : (
                    <div className="text-sm font-bold text-gray-900 truncate opacity-40">••••@••••.••</div>
                  )}
                </div>
              </div>
            )}

            <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 col-span-1 sm:col-span-2 ${!canSeePrivateData ? (isAuth ? 'opacity-50' : blurClass) : 'hover:bg-white hover:border-indigo-100 shadow-sm'}`}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm shrink-0"><MapPin size={18} /></div>
              <div className="flex-1 overflow-hidden">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{t('profileModal.businessAddress')}</div>
                {canSeePrivateData ? (
                  currentPro.address ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentPro.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-gray-900 leading-tight hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                    >
                      {currentPro.address}
                      <ExternalLink size={12} className="shrink-0 opacity-40" />
                    </a>
                  ) : (
                    <div className="text-sm font-bold text-gray-400 leading-tight italic">
                      {t('common.notSpecified')}
                    </div>
                  )
                ) : (
                  <div className="text-sm font-bold text-gray-900 truncate opacity-40">••••••••••••••••</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentPro.nationalities && currentPro.nationalities.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">{t('forms.nationality')}</h3>
                  <div className={`flex flex-wrap gap-2 transition-all`}>
                    {currentPro.nationalities.map(iso => (
                      <span key={iso} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                        <span className="text-sm">{getFlagEmoji(iso)}</span>
                        {t(`nationalities.${iso}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentPro.languages && currentPro.languages.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">{t('forms.languages')}</h3>
                  <div className={`flex flex-wrap gap-2 transition-all`}>
                    {currentPro.languages.map(lang => (
                      <span key={lang} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100">
                        <span className="text-sm">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                        {t(`languages.${lang}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">{t('profileModal.about')}</h3>
                {loadingDetails ? (
                  <div className="h-24 bg-gray-50 animate-pulse rounded-[28px]" />
                ) : (
                  <p className="text-gray-700 leading-relaxed font-medium text-sm md:text-base bg-gray-50/30 p-6 rounded-[28px] border border-gray-50">
                    {displayBio || t('common.notSpecified')}
                  </p>
                )}
            </div>

            {currentPro.specialties && currentPro.specialties.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">{t('profileModal.specialties')}</h3>
                <div className={`flex flex-wrap gap-2 transition-all`}>
                  {currentPro.specialties.map(s => (
                    <span key={s} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-100 shadow-sm">
                      {getSpecialtyLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <MessageSquareQuote size={16} className="text-amber-500" /> {t('common.reviews')} ({reviews.length})
              </h3>
              
              {loadingReviews ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
              ) : reviews.length > 0 ? (
                <ProfileReviewCarousel reviews={reviews} t={t} isBlurred={false} />
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-bold italic">{t('common.noReviewsYet')}</p>
                </div>
              )}
            </div>
          </div>

          {!canSeePrivateData && (
            <div className="mt-12 p-8 bg-gray-900 rounded-[36px] text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="w-16 h-16 bg-amber-500 rounded-[22px] flex items-center justify-center mx-auto mb-6 text-white shadow-lg animate-bounce">
                  {isAuth ? <Coins size={32} /> : <LogIn size={32} />}
                </div>
                <h4 className="text-white text-xl font-bold mb-4 uppercase tracking-widest">
                  {isAuth ? t('profileModal.unlockPrompt') : t('auth.welcome')}
                </h4>
                <button onClick={handleAction} className="w-full sm:w-auto bg-white text-gray-900 px-12 py-4 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 mx-auto shadow-xl active:scale-95">
                  {isAuth ? <><Lock size={18} /> {t('common.unlock')}</> : <><LogIn size={18} /> {t('nav.login')}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;