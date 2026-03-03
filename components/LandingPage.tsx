import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Globe, Search, Briefcase, X, Award, Navigation, MessageSquare, User, Star, MapPin, MessageSquareQuote, ChevronRight, ArrowDown, ChevronLeft, ShieldCheck, MessageSquareX, Zap, Shield, Target, MessageCircle, Plus } from 'lucide-react';
import Logo from './Logo';
import SearchBar from './SearchBar';
import ProfessionalCard from './ProfessionalCard';
import { CardSkeleton } from './Skeleton';
import { SearchFilters, Professional, UserType, UnlockToken } from '../types';
import { useTranslation } from 'react-i18next';

interface LandingPageProps {
  onSignUp: (role: UserType, e?: React.MouseEvent) => void; 
  onSearch: (filters: SearchFilters, e?: React.FormEvent) => void; 
  onLearnEarlyMember: () => void; 
  searchResults: Professional[] | null; 
  searchOriginName?: string; 
  onClearSearch: () => void; 
  isSearching: boolean; 
  onUnlock: (id: string, e?: React.MouseEvent) => void; 
  isAuth?: boolean; 
  hasRoleSelected?: boolean;
  onViewProfile: (pro: Professional) => void;
  currentUserId?: string;
  unlockedPros?: Record<string, UnlockToken>;
  userCoords?: { lat: number, lng: number } | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
  onSignUp, 
  onSearch, 
  onLearnEarlyMember, 
  searchResults, 
  searchOriginName, 
  onClearSearch, 
  isSearching, 
  onUnlock, 
  isAuth = false, 
  hasRoleSelected = true,
  onViewProfile,
  currentUserId,
  unlockedPros = {},
  userCoords
}) => {
  const { t, i18n } = useTranslation();
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const displayedResults = searchResults || [];

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
  }, [displayedResults]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth;
      const scrollAmount = direction === 'left' ? -cardWidth * 0.8 : cardWidth * 0.8;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  const showRoleChoice = isAuth && !hasRoleSelected;
  const heroDescription = showRoleChoice ? t('hero.choiceDescription') : t('hero.description');

  return (
    <div className="animate-in fade-in duration-700 overflow-x-hidden">
      {/* Hero Section */}
      <section className={`pt-32 pb-8 md:pt-48 md:pb-12 px-6 relative overflow-hidden transition-all duration-500 ${isSearchBarFocused ? 'z-[4001]' : 'z-0'} ${showRoleChoice ? 'min-h-[70vh] flex flex-col justify-center' : ''}`}>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-semibold text-gray-900 mb-8 leading-tight tracking-tight">
            {t('hero.title')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
              {t('hero.subtitle')}
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">{heroDescription}</p>
          
          {showRoleChoice && (
            <div className="flex flex-col items-center gap-1 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
               <div className="flex gap-[140px] md:gap-[280px]">
                 <ArrowDown className="text-blue-500 animate-bounce w-10 h-10 md:w-12 md:h-12" strokeWidth={3} />
                 <ArrowDown className="text-emerald-500 animate-bounce w-10 h-10 md:w-12 md:h-12" strokeWidth={3} />
               </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {!isAuth ? (
              <button 
                onClick={(e) => onSignUp('expat', e)} 
                className="bg-gradient-to-r from-[#45a081] to-[#2e75c2] text-white px-12 py-6 rounded-2xl font-bold text-xl hover:brightness-110 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 group"
              >
                {t('hero.ctaEnter')} <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button 
                  onClick={(e) => onSignUp('expat', e)} 
                  className={`bg-gradient-to-r from-[#45a081] to-[#2e75c2] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${showRoleChoice ? 'animate-heartbeat ring-8 ring-[#2e75c2]/10' : ''}`}
                >
                  {t('hero.ctaExpat')} <ArrowRight size={20} />
                </button>
                <button 
                  onClick={(e) => onSignUp('pro', e)} 
                  className={`bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${showRoleChoice ? 'animate-heartbeat ring-8 ring-emerald-500/10' : ''}`}
                >
                  <Briefcase size={20} /> {t('hero.ctaPro')}
                </button>
              </>
            )}
          </div>
        </div>

        {!showRoleChoice && (
          <div className="relative z-20 mt-12 mb-12 max-w-6xl mx-auto">
            <div className="text-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-semibold uppercase tracking-widest border border-indigo-100 shadow-sm">
                  <Search size={12} /> {t('search.badge')}
               </div>
            </div>
            <SearchBar onSearch={onSearch} onFocusChange={setIsSearchBarFocused} isSearching={isSearching} />
          </div>
        )}
      </section>
      
      {!showRoleChoice && (
        <>
          <div id="search-results-anchor" />

          {/* SEARCH RESULTS SECTION */}
          {searchResults !== null && (
            <div className="px-4 md:px-6 py-12 overflow-hidden border-t border-gray-50">
              <div className="max-w-6xl mx-auto relative">
                <div className="flex justify-between items-center mb-10 px-2 md:px-0">
                  <div className="flex items-center gap-3 bg-white px-4 md:px-6 py-3 rounded-[18px] md:rounded-[24px] border border-gray-100 shadow-sm">
                    <Navigation size={18} className="text-blue-500 md:w-5 md:h-5" />
                    <div>
                      <p className="text-[8px] md:text-[10px] font-semibold uppercase text-gray-400 leading-none mb-1">{t('landing.results.searchOrigin')}</p>
                      <p className="text-xs md:text-base font-semibold">{searchOriginName || t('search.nearMe')}</p>
                    </div>
                  </div>
                  <button onClick={onClearSearch} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold uppercase text-gray-400 hover:text-red-500 transition-all shadow-sm active:scale-95"><X size={14} className="md:w-4 md:h-4" /> {t('landing.results.close')}</button>
                </div>
                
                {isSearching ? (
                  <div className="md:grid md:grid-cols-2 flex overflow-x-auto no-scrollbar gap-4 md:gap-10 pb-8 px-2 md:px-0">
                    {[1,2].map(i => (
                      <div key={i} className="shrink-0 w-[85vw] md:w-full">
                        <CardSkeleton />
                      </div>
                    ))}
                  </div>
                ) : displayedResults.length > 0 ? (
                  <div className="relative group/results px-2 md:px-0">
                    <div 
                      ref={scrollContainerRef}
                      onScroll={updateScrollButtons}
                      className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:gap-8 pb-12"
                    >
                      {displayedResults.map(pro => (
                        <div key={pro.id} className="snap-center shrink-0 w-[85vw] md:w-[calc(50%-1rem)]">
                          <ProfessionalCard 
                            professional={pro} 
                            isUnlocked={!!unlockedPros[pro.id]} 
                            isAuth={isAuth} 
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
                  <div className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200 mx-2 md:mx-0"><Search size={48} className="mx-auto text-gray-200 mb-6" /><h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">{t('landing.results.noneTitle')}</h3></div>
                )}
              </div>
            </div>
          )}

          {/* BENEFITS SECTION - INSPIRED BY HEALTHCARE UI (CENTERED BLOCKS) */}
          <section className="py-32 md:py-48 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-24 md:mb-36">
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-6 border border-indigo-100/50 shadow-sm">
                  <Sparkles size={14} /> {t('landing.benefits.tag')}
                </div>
                <h2 className="text-4xl md:text-6xl font-semibold text-gray-900 tracking-tight leading-[1.1]">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">
                    {t('landing.benefits.title').split(' ')[0]}
                  </span><br />
                  {t('landing.benefits.title').split(' ').slice(1).join(' ')}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-20 md:gap-24">
                {/* Benefit 1: Trust */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                     <div className="absolute inset-0 bg-blue-50 rounded-[48px] scale-[1.3] blur-2xl opacity-40 group-hover:scale-[1.4] transition-transform duration-1000"></div>
                     <div className="absolute inset-0 bg-blue-50/80 rounded-[40px] shadow-inner"></div>
                     <div className="relative z-10 text-blue-500 group-hover:scale-110 transition-transform duration-500">
                       <ShieldCheck size={56} strokeWidth={1.5} />
                     </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-5 leading-tight">{t('landing.benefits.item1.title')}</h3>
                  <p className="text-gray-500 text-base md:text-lg leading-relaxed font-medium max-w-xs">
                    {t('landing.benefits.item1.desc')}
                  </p>
                </div>

                {/* Benefit 2: Exchange / Support */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                     <div className="absolute inset-0 bg-emerald-50 rounded-[48px] scale-[1.3] blur-2xl opacity-40 group-hover:scale-[1.4] transition-transform duration-1000"></div>
                     <div className="absolute inset-0 bg-emerald-50/80 rounded-[40px] shadow-inner"></div>
                     <div className="relative z-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                       <MessageCircle size={56} strokeWidth={1.5} />
                     </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-5 leading-tight">{t('landing.benefits.item2.title')}</h3>
                  <p className="text-gray-500 text-base md:text-lg leading-relaxed font-medium max-w-xs">
                    {t('landing.benefits.item2.desc')}
                  </p>
                </div>

                {/* Benefit 3: Speed / Direction */}
                <div className="flex flex-col items-center text-center group">
                  <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                     <div className="absolute inset-0 bg-indigo-50 rounded-[48px] scale-[1.3] blur-2xl opacity-40 group-hover:scale-[1.4] transition-transform duration-1000"></div>
                     <div className="absolute inset-0 bg-indigo-50/80 rounded-[40px] shadow-inner"></div>
                     <div className="relative z-10 text-indigo-500 group-hover:scale-110 transition-transform duration-500">
                       <Navigation size={56} strokeWidth={1.5} />
                     </div>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-5 leading-tight">{t('landing.benefits.item3.title')}</h3>
                  <p className="text-gray-500 text-base md:text-lg leading-relaxed font-medium max-w-xs">
                    {t('landing.benefits.item3.desc')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* GEOGRAPHIC GROWTH SECTION */}
          <section className="py-24 md:py-36 px-6 border-t border-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest mb-8 border border-blue-100 shadow-sm animate-pulse">
                <Globe size={14} /> {t('landing.presence.tag')}
              </div>
              <h2 className="text-4xl md:text-6xl font-semibold text-gray-900 tracking-tight mb-6 leading-tight">
                {i18n.language?.startsWith('fr') ? (
                  <>
                    Nous nous{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">
                      développons
                    </span>{' '}
                    en Espagne
                  </>
                ) : (
                  <>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">
                      {t('landing.presence.title').split(' ')[0]}
                    </span>{' '}
                    {t('landing.presence.title').split(' ').slice(1).join(' ')}
                  </>
                )}
              </h2>
              <p className="text-gray-500 text-lg md:text-xl font-medium mb-16 leading-relaxed max-w-2xl mx-auto">
                {t('landing.presence.subtitle')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {(t('landing.presence.cities') || "").split(' • ').map((city, idx) => (
                  <div key={idx} className="group relative">
                    <div className="absolute inset-0 bg-[#45a081]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative px-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-xs md:text-sm font-semibold text-gray-700 group-hover:bg-gradient-to-r group-hover:from-[#45a081] group-hover:to-[#2e75c2] group-hover:text-white group-hover:border-transparent group-hover:-translate-y-1 transition-all flex items-center gap-2 shadow-sm cursor-default">
                      <MapPin size={14} className="text-indigo-400 group-hover:text-white transition-colors" />
                      {city}
                    </span>
                  </div>
                ))}
                
                {/* Badge "+" pour indiquer d'autres villes en cours */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative px-6 py-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-xs md:text-sm font-bold text-gray-400 group-hover:bg-black group-hover:text-white group-hover:border-transparent group-hover:-translate-y-1 transition-all flex items-center gap-2 shadow-sm cursor-default">
                    <Plus size={14} className="text-gray-300 group-hover:text-white" />
                    ...
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* FOUNDER QUOTE SECTION - REPLACES TESTIMONIALS */}
          <section className="py-24 md:py-48 px-6 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white text-[#45a081] border border-[#45a081]/10 px-5 py-2 rounded-full text-[10px] font-semibold uppercase mb-16 shadow-sm">
                <Logo className="w-4 h-4" /> {t('landing.testimonialTag')}
              </div>
              
              <div className="relative">
                {/* Stylized Quotation Marks */}
                <span className="absolute -top-16 -left-4 md:-left-12 text-[120px] md:text-[200px] text-indigo-500/10 font-serif leading-none select-none pointer-events-none">“</span>
                <span className="absolute -bottom-32 -right-4 md:-right-12 text-[120px] md:text-[200px] text-[#45a081]/10 font-serif leading-none select-none pointer-events-none">”</span>
                
                <blockquote className="text-2xl md:text-4xl lg:text-5xl font-semibold leading-[1.3] text-gray-800 italic animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  {t('landing.founderQuote')}
                </blockquote>
              </div>

              <div className="mt-16 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500">
                 <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />
                 <div className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-gray-400">
                   ExpaLink Founders
                 </div>
              </div>
            </div>
          </section>

          {/* UNIFIED PRO CTA & LAUNCH PHASE SECTION */}
          <section className="py-24 px-6 overflow-hidden">
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-[#45a081] to-[#2e75c2] rounded-[48px] md:rounded-[64px] p-10 md:p-20 text-white relative overflow-hidden shadow-2xl flex flex-col gap-12 md:gap-20 transition-all hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.3)] border border-white/10">
                
                {/* Top Part: Title & Action */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="max-w-xl text-center lg:text-left space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-medium uppercase tracking-widest border border-white/20">
                      <Award size={14} className="text-white" /> {t('earlyMember.badge')}
                    </div>
                    <h2 className="text-4xl md:text-7xl font-semibold mb-6 leading-[0.95] tracking-tighter">
                      {t('landing.earlyCTA.title')} <br />
                      <span className="text-white/80">{t('landing.earlyCTA.subtitle')}</span>
                    </h2>
                    <p className="text-white/90 text-lg md:text-2xl font-normal max-w-md leading-relaxed">
                      {t('landing.earlyCTA.desc')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => onSignUp('pro')} 
                    className="bg-white text-[#45a081] px-12 py-7 rounded-[28px] font-medium text-xl hover:bg-white/90 transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] active:scale-95 shrink-0 group/btn"
                  >
                    {t('landing.earlyCTA.btn')} 
                    <ArrowRight size={26} className="group-hover/btn:translate-x-1.5 transition-transform" />
                  </button>
                </div>

                {/* Visual Divider with Glow */}
                <div className="relative h-px w-full overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>

                {/* Bottom Part: Detailed Launch Phase Offer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
                  <div className="space-y-10">
                    <div className="text-white font-medium text-[11px] uppercase tracking-[0.4em] flex items-center gap-3 opacity-90">
                      <Target size={20} /> {t('earlyMember.program.tag')}
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-3xl md:text-5xl font-semibold text-white leading-[1.1]">
                        {t('earlyMember.program.title')} <br />
                        <span className="text-white/60">{t('earlyMember.program.subtitle')}</span>
                      </h3>
                      <div className="space-y-4 pl-1">
                        <div className="flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-xl border border-white/10">
                           <ShieldCheck size={18} className="text-white" />
                           <p className="text-sm font-medium uppercase text-white tracking-widest">
                             {t('earlyMember.program.cancelAnytime')}
                           </p>
                        </div>
                        <p className="text-[12px] font-medium uppercase text-white/50 tracking-wider">
                          {t('earlyMember.program.limitedOffer')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stat Cards - Non-bold / Harmonized */}
                  <div className="grid grid-cols-2 gap-5 md:gap-8">
                     <div className="p-8 md:p-12 bg-white/10 rounded-[40px] border border-white/20 backdrop-blur-2xl flex flex-col justify-center items-center text-center transition-all hover:bg-white/15 hover:border-white/40 group/stat shadow-xl">
                        <div className="text-6xl md:text-7xl font-medium text-white mb-3 tracking-tighter group-hover/stat:scale-105 transition-transform">0€</div>
                        <div className="text-[10px] md:text-[11px] uppercase text-white/60 font-medium tracking-[0.25em]">{t('earlyMember.stats.fee')}</div>
                     </div>
                     <div className="p-8 md:p-12 bg-white/10 rounded-[40px] border border-white/20 backdrop-blur-2xl flex flex-col justify-center items-center text-center transition-all hover:bg-white/15 hover:border-white/40 group/stat shadow-xl">
                        <div className="text-6xl md:text-7xl font-medium text-white mb-3 tracking-tighter group-hover/stat:scale-105 transition-transform">0%</div>
                        <div className="text-[10px] md:text-[11px] uppercase text-white/60 font-medium tracking-[0.25em]">{t('earlyMember.stats.commission')}</div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default LandingPage;