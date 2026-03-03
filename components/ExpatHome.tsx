import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Coins, ShieldCheck, Repeat, X, Navigation, Briefcase, Search, ChevronRight, ShieldAlert, ChevronLeft } from 'lucide-react';
import SearchBar from './SearchBar';
import ProfessionalCard from './ProfessionalCard';
import { CardSkeleton } from './Skeleton';
import { SearchFilters, Professional, UnlockToken } from '../types';
import { useTranslation } from 'react-i18next';

interface ExpatHomeProps {
  userName: string; 
  credits: number; 
  unlockedCount: number; 
  preferredCity?: string; 
  allRealPros: Professional[]; 
  onSearch: (filters: SearchFilters & { lat?: number; lng?: number; locationName?: string }) => void; 
  onGoToDashboard: (e?: React.MouseEvent) => void; 
  onAddCredits: (e?: React.MouseEvent) => void; 
  onSwitchToPro: (e?: React.MouseEvent) => void; 
  searchResults: Professional[] | null; 
  searchOriginName?: string;
  onClearSearch: () => void; 
  unlockedPros: Record<string, UnlockToken>; 
  onUnlock: (id: string, e?: React.MouseEvent) => void; 
  isSearching?: boolean; 
  onViewProfile: (pro: Professional) => void; 
  onMessagePro: (pro: Professional, e?: React.MouseEvent) => void;
  onSetSearchResults: (pros: Professional[], originName?: string) => void;
  currentUserId?: string;
  profile?: any;
  onAdminClick?: () => void;
  userCoords?: { lat: number, lng: number } | null;
}

const ExpatHome: React.FC<ExpatHomeProps> = ({ 
  userName, 
  credits, 
  unlockedCount, 
  onSearch, 
  onGoToDashboard, 
  onAddCredits, 
  onSwitchToPro, 
  searchResults, 
  searchOriginName,
  onClearSearch, 
  unlockedPros, 
  onUnlock, 
  isSearching = false, 
  onViewProfile,
  currentUserId,
  profile,
  onAdminClick,
  userCoords
}) => {
  const { t } = useTranslation();
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const memoizedSearchResults = useMemo(() => {
    return searchResults || [];
  }, [searchResults]);

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
  }, [memoizedSearchResults]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = direction === 'left' ? -cardWidth * 0.8 : cardWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-in fade-in duration-500 overflow-x-hidden">
      <section className={`pt-32 pb-12 md:pt-48 px-6 relative overflow-hidden transition-all duration-500 ${isSearchBarFocused ? 'z-[2000]' : 'z-0'}`}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-50/40 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/40 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="flex flex-col items-center text-center lg:col-span-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-10 leading-[1.1] tracking-tight">
              {t('auth.welcome')}, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">
                {userName || 'Expert'}
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10 w-full max-w-md lg:max-w-none">
              {profile?.is_admin && onAdminClick ? (
                <button onClick={onAdminClick} className="flex-1 bg-blue-600 text-white px-8 py-4 rounded-[20px] font-bold text-base hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  Administration <ShieldAlert size={18} />
                </button>
              ) : (
                <>
                  <button onClick={(e) => onGoToDashboard(e)} className="flex-1 bg-black text-white px-8 py-4 rounded-[20px] font-bold text-base hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                    {t('expatHome.relocationSpace')} <ArrowRight size={20} />
                  </button>
                  <button onClick={(e) => onSwitchToPro(e)} className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-8 py-4 rounded-[20px] font-bold text-base hover:bg-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                    <Repeat size={18} /> {t('expatHome.switchToPro')}
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap lg:flex-nowrap justify-center gap-4 w-full">
              <div className="flex items-center gap-4 px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm cursor-pointer group hover:border-amber-200 transition-colors" onClick={(e) => onAddCredits(e)}>
                <div className="w-11 h-11 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Coins size={22} />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 leading-none">{credits}</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mt-1.5">{t('expatHome.credits')}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-6 py-4 bg-white border border-gray-100 rounded-[24px] shadow-sm cursor-pointer group hover:border-indigo-200 transition-colors" onClick={(e) => onGoToDashboard(e)}>
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-900 leading-none">{unlockedCount}</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mt-1.5">{t('expatHome.saved')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-6 h-[500px] rounded-[56px] overflow-hidden shadow-2xl border-8 border-white animate-in slide-in-from-right-8 duration-1000 bg-gray-50">
            <img 
              src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=60&w=800" 
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover" 
              alt="Sunny city in Spain - Expatriation and Relocation" 
            />
          </div>
        </div>
        
        <div className="mt-20 max-w-6xl mx-auto px-1">
          <SearchBar onSearch={onSearch} onFocusChange={setIsSearchBarFocused} isSearching={isSearching} />
        </div>
      </section>

      <div id="search-results-anchor" />
      {searchResults !== null && (
        <div className="px-4 md:px-6 py-12 bg-gray-50/50 overflow-hidden">
          <div className="max-w-6xl mx-auto relative">
            <div className="flex justify-between items-center mb-10 px-2 md:px-0">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[24px] border border-gray-100 shadow-sm">
                <Navigation size={20} className="text-indigo-500" />
                <div>
                  <p className="text-[9px] font-semibold uppercase text-gray-400 leading-none mb-1">{t('landing.results.searchOrigin')}</p>
                  <p className="text-sm md:text-base font-bold">{searchOriginName || t('search.nearMe')}</p>
                </div>
              </div>
              <button onClick={onClearSearch} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-semibold uppercase text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-95">
                <X size={16} /> {t('common.close')}
              </button>
            </div>

            {isSearching ? (
              <div className="md:grid md:grid-cols-2 flex overflow-x-auto no-scrollbar gap-6 md:gap-10 pb-8 px-2 md:px-0">
                {[1,2].map(i => (
                  <div key={i} className="shrink-0 w-[85vw] md:w-full">
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            ) : memoizedSearchResults.length > 0 ? (
              <div className="relative group/results px-2 md:px-0">
                <div 
                  ref={scrollContainerRef}
                  onScroll={updateScrollButtons}
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-8 pb-12"
                >
                  {memoizedSearchResults.map(pro => (
                    <div key={pro.id} className="snap-center shrink-0 w-[85vw] md:w-[calc(50%-1.5rem)]">
                      <ProfessionalCard 
                        professional={pro} 
                        isUnlocked={!!unlockedPros[pro.id]} 
                        isAuth={true} 
                        currentUserId={currentUserId}
                        onUnlock={(id, e) => onUnlock(id, e)} 
                        onViewProfile={onViewProfile} 
                        userCoords={userCoords}
                      />
                    </div>
                  ))}
                </div>

                {/* Left Arrow - Visible on all screens */}
                {canScrollLeft && (
                  <button 
                    onClick={() => scroll('left')}
                    className="absolute -left-2 lg:-left-6 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 lg:p-5 rounded-full shadow-2xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all group/arrow flex"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} className="lg:w-7 lg:h-7 group-hover/arrow:-translate-x-1 transition-transform" />
                  </button>
                )}

                {/* Right Arrow - Visible on all screens */}
                {canScrollRight && (
                  <button 
                    onClick={() => scroll('right')}
                    className="absolute -right-2 lg:-right-6 top-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-xl p-3 lg:p-5 rounded-full shadow-2xl border border-white/50 text-indigo-600 hover:scale-110 active:scale-90 transition-all group/arrow flex"
                  >
                    <ChevronRight size={24} strokeWidth={2.5} className="lg:w-7 lg:h-7 group-hover/arrow:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 mx-2 md:mx-0">
                <Search size={48} className="mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">{t('landing.results.noneTitle')}</h3>
                <p className="text-sm text-gray-400 font-medium mt-2">{t('landing.results.noneDesc')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <section className="py-24 px-6 bg-gray-50/50 overflow-hidden">
        <div className="max-w-5xl mx-auto bg-black rounded-[48px] p-12 md:p-20 text-white flex flex-col items-center justify-center text-center gap-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
            <Briefcase size={200} />
          </div>
          <div className="max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase mb-6 mx-auto">
              <Sparkles size={14} /> {t('expatHome.areYouExpert')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {t('expatHome.joinNetwork')}
            </h2>
            <p className="text-gray-400 text-lg font-medium">
              {t('proHome.description')}
            </p>
          </div>
          <button 
            onClick={(e) => onSwitchToPro(e)}
            className="bg-white text-black px-12 py-6 rounded-[24px] font-bold text-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 shadow-xl relative z-10 active:scale-95"
          >
            {t('expatHome.becomePro')} <ArrowRight size={24} />
          </button>
        </div>
      </section>
    </div>
  );
};

export default ExpatHome;