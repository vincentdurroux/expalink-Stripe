import React, { useMemo } from 'react';
import { Star, ChevronRight, Lock, ShieldCheck, Navigation, User2, Briefcase, Globe, Sparkles, Trophy, MapPin, GraduationCap, LogIn, Calendar, ExternalLink } from 'lucide-react';
import { Professional } from '../types';
import { useTranslation } from 'react-i18next';
import { getFlagEmoji, LANGUAGE_FLAGS } from '../constants';
import { calculateHaversineDistance } from '../services/userService';

/**
 * Détecte la plateforme de réservation à partir de l'URL
 */
export const getBookingPlatform = (url: string) => {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('calendly.com')) return { name: 'Calendly', color: 'bg-[#006bff]' };
  if (lower.includes('doctolib')) return { name: 'Doctolib', color: 'bg-[#0596de]' };
  if (lower.includes('doctoralia')) return { name: 'Doctoralia', color: 'bg-[#36c1ba]' };
  if (lower.includes('resalib')) return { name: 'Resalib', color: 'bg-[#2ecc71]' };
  if (lower.includes('treatwell')) return { name: 'Treatwell', color: 'bg-[#ff5a5f]' };
  if (lower.includes('google.com/calendar') || lower.includes('calendar.google')) return { name: 'Google Calendar', color: 'bg-[#4285f4]' };
  if (lower.includes('cal.com')) return { name: 'Cal.com', color: 'bg-black' };
  return { name: '', color: 'bg-indigo-600' };
};

interface ProfessionalCardProps {
  professional: Professional;
  isUnlocked: boolean;
  isAuth: boolean;
  isPremium?: boolean;
  currentUserId?: string;
  onUnlock: (id: string, e: React.MouseEvent) => void;
  onViewProfile?: (pro: Professional) => void;
  isStatic?: boolean;
  hideButtons?: boolean;
  userCoords?: { lat: number, lng: number } | null;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ 
  professional: pro, 
  isUnlocked, 
  isAuth, 
  isPremium = false,
  currentUserId,
  onUnlock, 
  onViewProfile,
  isStatic = false,
  hideButtons = false,
  userCoords
}) => {
  const { t, i18n } = useTranslation();

  if (!pro) return null;

  const isOwner = currentUserId && pro.id === currentUserId;
  const canSeeInfo = isUnlocked || isStatic || isOwner || isPremium;
  const safeName = pro.name || t('common.expert');
  
  const displayNameDisplay = useMemo(() => {
    if (canSeeInfo) return safeName;
    return (
      <span className="blur-[8px] select-none opacity-40">
        {safeName}
      </span>
    );
  }, [safeName, canSeeInfo]);

  const distanceStr = useMemo(() => {
    let dist = pro.distance_km;
    if ((dist === null || dist === undefined) && userCoords) {
      if (pro.latitude && pro.longitude) {
        dist = calculateHaversineDistance(userCoords.lat, userCoords.lng, pro.latitude, pro.longitude);
      }
    }
    if (!dist || dist >= 9990) return '';
    return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  }, [pro.distance_km, pro.latitude, pro.longitude, userCoords]);

  const platform = useMemo(() => getBookingPlatform(pro.bookingUrl || ''), [pro.bookingUrl]);

  const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';
  
  const getSpecialtyLabel = (s: string) => {
    if (pro.specialtyTranslations?.[currentLang]?.[s]) {
      return pro.specialtyTranslations[currentLang][s];
    }
    const key = `specialties.${s}`;
    const translated = t(key);
    return translated === key ? s : translated;
  };

  const handleAction = (e: React.MouseEvent) => {
    if (isStatic || isOwner || isPremium) return;
    e.preventDefault(); e.stopPropagation();
    onUnlock(pro.id, e); 
  };

  const handleViewProfile = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (onViewProfile) onViewProfile(pro);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!canSeeInfo) {
      onUnlock(pro.id, e);
    } else if (pro.bookingUrl) {
      window.open(pro.bookingUrl, '_blank');
    }
  };

  return (
    <div className={`apple-card group overflow-hidden flex flex-col h-full bg-white relative border border-gray-100 transition-all duration-300 ${!isStatic ? 'hover:border-indigo-200 shadow-sm hover:shadow-xl hover:-translate-y-1' : ''}`}>
      
      <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-[130]">
        {distanceStr && (
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20 animate-in zoom-in duration-500">
            <Navigation size={10} className="fill-white" />
            <span className="text-[10px] font-black uppercase tracking-tight leading-none whitespace-nowrap">{distanceStr}</span>
          </div>
        )}
        {pro.verified && (
          <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-bold uppercase shadow-md border border-white/10">
            <ShieldCheck size={14} /> {t('common.verified')}
          </div>
        )}
      </div>

      <div className="relative h-24 md:h-28 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 overflow-hidden cursor-pointer" onClick={handleViewProfile}>
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {pro.isEarlyMember && (
            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase shadow-sm border border-white/10">
              <Trophy size={14} /> {t('nav.earlyMember')}
            </div>
          )}
          {pro.isFeatured && (
            <div className="bg-violet-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-bold uppercase shadow-sm border border-white/10">
              <Sparkles size={14} fill="currentColor" /> {t('common.featuredBadge')}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex justify-center -mt-12 md:-mt-16 mb-6">
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[36px] md:rounded-[48px] ring-[8px] ring-white shadow-xl bg-gray-100 overflow-hidden shrink-0 cursor-pointer" onClick={handleViewProfile}>
          {pro.image ? (
            <img 
              src={pro.image} 
              alt="" 
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${!canSeeInfo ? 'blur-md opacity-50 grayscale-[0.5]' : ''}`} 
              loading="lazy" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white bg-gray-200">
              <User2 size={48} className="md:w-16 md:h-16 text-gray-400" />
            </div>
          )}
          {!canSeeInfo && !isStatic && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5">
              <div className="bg-white/90 p-3 rounded-full shadow-lg border border-white/50 animate-pulse">
                <Lock size={24} className="text-gray-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8 flex flex-col flex-1 text-center items-center">
        <div className="mb-6 w-full">
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{displayNameDisplay}</h3>
            {Number(pro.reviews) > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100/50 shadow-sm">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-gray-900">{(pro.rating || 5.0).toFixed(1)}</span>
                <span className="text-[10px] font-semibold text-gray-400">({pro.reviews})</span>
              </div>
            )}
          </div>
          <p className="text-indigo-600 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-indigo-50/50 py-2 rounded-2xl px-5 w-fit mx-auto">
            <Briefcase size={14} /> {pro.professions?.[0] ? t(`professions.${pro.professions[0]}`) : t('common.expert')}
          </p>
          {pro.specialties && pro.specialties.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {pro.specialties.slice(0, 3).map((s) => (
                <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold uppercase tracking-tight border border-emerald-100/50">
                  {getSpecialtyLabel(s)}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6 w-full">
          <div className="flex items-start flex-col gap-1 p-3 bg-gray-50/50 rounded-[20px] border border-gray-100/50">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{t('forms.genderLabel')}</span>
            <div className="flex items-center gap-2 truncate w-full text-[12px] font-bold text-gray-700 capitalize">
              <User2 size={14} className="text-indigo-400 shrink-0" /> {pro.gender ? t(`common.${pro.gender}`) : t('common.prefer-not-to-say')}
            </div>
          </div>
          <div className="flex items-start flex-col gap-1 p-3 bg-gray-50/50 rounded-[20px] border border-gray-100/50">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">{t('forms.yearsOfExperience')}</span>
            <div className="flex items-center gap-2 truncate w-full text-[12px] font-bold text-gray-700">
              <GraduationCap size={14} className="text-emerald-500 shrink-0" /> {pro.yearsOfExperience} {t('common.yearsExp')}
            </div>
          </div>
          <div className="flex items-start flex-col gap-1 p-3 bg-gray-50/50 rounded-[20px] border border-gray-100/50 w-full overflow-hidden">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('forms.languages')}</span>
            <div className="flex flex-wrap gap-2 w-full">
              {pro.languages?.slice(0, 3).map(l => <span key={l} className="text-base leading-tight">{LANGUAGE_FLAGS[l] || '🌐'}</span>)}
            </div>
          </div>
          <div className="flex items-start flex-col gap-1 p-3 bg-gray-50/50 rounded-[20px] border border-gray-100/50 w-full overflow-hidden">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('forms.nationality')}</span>
            <div className="flex flex-wrap gap-2 w-full">
              {pro.nationalities && pro.nationalities.length > 0 ? pro.nationalities.slice(0, 2).map(iso => <span key={iso} className="text-sm leading-tight">{getFlagEmoji(iso)}</span>) : <Globe size={14} className="text-gray-300" />}
            </div>
          </div>
        </div>

        <div className="w-full p-3 bg-indigo-50/30 rounded-[20px] border border-indigo-100/20 mb-4 flex items-center gap-3">
          <MapPin size={16} className="text-indigo-400 shrink-0" />
          <div className="flex-1 text-left overflow-hidden">
            <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest block">{t('forms.cities')}</span>
            <div className="text-[11px] font-bold text-gray-700 truncate">{pro.cities?.slice(0, 2).map(c => t(`cities.${c}`) || c).join(', ') || t('common.notSpecified')}</div>
          </div>
        </div>

        {/* SECTION RÉSERVATION DYNAMIQUE */}
        {pro.bookingUrl && !hideButtons && platform && (
          <div className={`w-full p-3 ${platform.color} rounded-[20px] mb-4 flex items-center gap-3 cursor-pointer transition-all active:scale-95 hover:brightness-110 shadow-md ${!canSeeInfo ? 'opacity-40 grayscale blur-[0.5px]' : ''}`} onClick={handleBookingClick}>
            <Calendar size={16} className="text-white shrink-0" />
            <div className="flex-1 text-left overflow-hidden">
              <span className="text-[8px] font-bold text-white/70 uppercase tracking-widest block leading-none mb-1">
                {platform.name || t('booking.label')}
              </span>
              <div className="text-[11px] font-black text-white truncate flex items-center gap-2">
                {platform.name ? t('booking.btnWithPlatform', { name: platform.name }) : t('booking.btn')}
                <ExternalLink size={10} className="opacity-60" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto w-full flex flex-col gap-3">
          {!hideButtons && (!isStatic ? (
              <>
                {isAuth ? (
                  <>
                    {!canSeeInfo && (
                      <button onClick={handleAction} className="w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white h-12 md:h-14 rounded-[18px] font-bold text-sm shadow-xl active:scale-[0.97] flex items-center justify-center gap-3 hover:brightness-110 transition-all">
                        <Lock size={16} /> <span className="uppercase tracking-[0.05em]">{t('common.unlock')}</span>
                      </button>
                    )}
                    <button onClick={handleViewProfile} className="w-full bg-white border-2 border-gray-100 text-gray-900 h-12 md:h-14 rounded-[18px] font-bold text-sm shadow-sm active:scale-[0.97] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                      {isUnlocked || isPremium ? <ChevronRight size={18} /> : <User2 size={18} />} <span className="uppercase tracking-[0.05em]">{isOwner ? t('profile.ownerAccess') : t('common.viewProfile')}</span>
                    </button>
                  </>
                ) : (
                  <button onClick={handleAction} className="w-full bg-black text-white h-12 md:h-14 rounded-[18px] font-bold text-[10px] md:text-xs shadow-xl active:scale-[0.97] flex items-center justify-center gap-3 hover:bg-gray-800 transition-all px-4">
                    <LogIn size={16} /> <span className="uppercase tracking-[0.05em] leading-tight">{t('common.loginToUnlock')}</span>
                  </button>
                )}
              </>
            ) : (
              <button onClick={handleViewProfile} className="mt-auto w-full bg-white border-2 border-gray-100 text-gray-900 h-12 md:h-14 rounded-[18px] font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 shadow-sm">{t('common.viewProfile')}</button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCard;