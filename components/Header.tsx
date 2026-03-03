import React, { useState, useRef, useEffect } from 'react';
import Logo from './Logo';
import { 
  Coins, LogOut, User, LayoutDashboard, 
  Globe, ChevronDown, HelpCircle, 
  Sparkles, CreditCard, ArrowRightLeft,
  X, ShieldAlert
} from 'lucide-react';
import { UserType } from '../types';
import { useTranslation } from 'react-i18next';
import { Language } from '../translations';

interface HeaderProps {
  user?: any;
  profile?: any;
  credits: number;
  isPremium?: boolean;
  onAddCredits: (e: React.MouseEvent) => void;
  userType: UserType | null;
  onLogout: (e: React.MouseEvent) => void;
  onLogoClick: (e: React.MouseEvent) => void;
  onHowItWorksClick: (e: React.MouseEvent) => void;
  currentView?: string;
  onDashboardClick?: (e: React.MouseEvent) => void;
  onProfileClick: (e: React.MouseEvent) => void;
  onSignUpClick?: (e: React.MouseEvent) => void;
  onSubscriptionClick?: (e: React.MouseEvent) => void;
  onSwitchMode?: (target: UserType, e?: React.MouseEvent) => void;
  onAdminClick?: () => void;
  isLocked?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  user,
  profile: dbProfile,
  credits, 
  onAddCredits, 
  userType, 
  onLogout, 
  onLogoClick, 
  onHowItWorksClick,
  currentView,
  onDashboardClick,
  onProfileClick,
  onSignUpClick,
  onSubscriptionClick,
  onSwitchMode,
  onAdminClick,
  isLocked = false
}) => {
  const { t, i18n } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        const toggleBtn = (event.target as HTMLElement).closest('.mobile-toggle-btn');
        if (!toggleBtn) setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' }
  ];

  const activeLangCode = i18n.language ? (i18n.language.split('-')[0] as Language) : 'en';
  const currentLang = languages.find(l => l.code === activeLangCode) || languages[0];

  const finalAvatarUrl = dbProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const isMultiRole = dbProfile?.is_pro && dbProfile?.is_expat;

  const showPublicLinks = (currentView === 'landing' || (!user || !dbProfile?.role_selected)) && currentView !== 'auth';

  const handleMobileNav = (action: (e: any) => void) => {
    return (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      action(e);
      setShowMobileMenu(false);
    };
  };

  const handleLanguageChange = (code: Language) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  const shouldShowCredits = user && 
                     userType === 'expat' && 
                     dbProfile?.role_selected && 
                     currentView !== 'landing' && 
                     !isLocked;

  const activeEmerald = "text-[#45a081]";
  const activeIndigo = "text-[#2e75c2]";
  const activeAmber = "text-amber-600";
  const inactiveBrandClass = "text-gray-400 hover:text-gray-900";

  const mobileBtnBaseClass = "w-full text-left p-4 rounded-[24px] text-[15px] font-bold flex items-center transition-all duration-300 active:scale-[0.97] animate-in fade-in slide-in-from-top-6 fill-mode-both duration-700 ease-out group";
  const mobileHoverClass = "hover:bg-gradient-to-r hover:from-[#45a081] hover:to-[#2e75c2] hover:text-white hover:shadow-lg hover:shadow-emerald-500/20";

  return (
    <header className="fixed top-0 left-0 right-0 z-[5000] apple-blur border-b border-gray-200/50 h-16 md:h-20 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 transition-all shrink-0 cursor-pointer group" onClick={(e) => onLogoClick(e)}>
          <Logo className={`w-8 h-8 md:w-9 md:h-9 transition-transform ${!isLocked && 'group-hover:scale-105 active:scale-95'}`} />
          <span className="hidden sm:inline text-xl md:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2] animate-brand-text">
            ExpaLink
          </span>
        </div>

        {!isLocked && (
          <nav className="hidden lg:flex items-center justify-center gap-10 overflow-x-auto no-scrollbar whitespace-nowrap py-1 flex-1 px-8">
            {showPublicLinks ? (
              null
            ) : currentView !== 'auth' ? (
              <div className="flex items-center gap-8">
                {userType === 'expat' ? (
                    <>
                      <button onClick={(e) => { e.preventDefault(); onDashboardClick && onDashboardClick(e); }} className={`flex items-center gap-2 text-base font-bold transition-all shrink-0 ${currentView === 'expat-dashboard' ? activeIndigo : inactiveBrandClass}`}>
                        <Globe size={18} className={currentView === 'expat-dashboard' ? activeIndigo : 'text-gray-300'} /> {t('nav.myRelocation')}
                      </button>
                      {shouldShowCredits && (
                        <button onClick={(e) => { e.preventDefault(); onAddCredits(e); }} className={`flex items-center gap-2 text-base font-bold transition-all shrink-0 ${currentView === 'credits' ? activeAmber : inactiveBrandClass}`}>
                          <Coins size={18} className={currentView === 'credits' ? activeAmber : 'text-gray-300'} /> {t('nav.buyCredits')} ({credits})
                        </button>
                      )}
                    </>
                ) : userType === 'pro' ? (
                    <>
                      <button onClick={(e) => { e.preventDefault(); onDashboardClick && onDashboardClick(e); }} className={`flex items-center gap-2 text-base font-bold transition-all shrink-0 ${currentView === 'pro-dashboard' ? activeEmerald : inactiveBrandClass}`}>
                        <LayoutDashboard size={18} className={currentView === 'pro-dashboard' ? activeEmerald : 'text-gray-300'} /> {t('nav.myBusiness')}
                      </button>
                      <button onClick={(e) => { e.preventDefault(); onSubscriptionClick && onSubscriptionClick(e); }} className={`flex items-center gap-2 text-base font-bold transition-all shrink-0 ${currentView === 'subscription' ? activeIndigo : inactiveBrandClass}`}>
                        <CreditCard size={18} className={currentView === 'subscription' ? activeIndigo : 'text-gray-300'} /> {t('nav.plans')}
                      </button>
                    </>
                ) : null}

                {isMultiRole && (
                  <button onClick={(e) => { e?.preventDefault(); onSwitchMode?.(userType === 'expat' ? 'pro' : 'expat', e); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[11px] font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 shrink-0">
                    <ArrowRightLeft size={12} />
                    {userType === 'expat' ? t('nav.switchPro') : t('nav.switchExpat')}
                  </button>
                )}
              </div>
            ) : null}
          </nav>
        )}

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {!isLocked && (
            <button 
              onClick={(e) => { e.preventDefault(); onHowItWorksClick(e); }}
              className={`p-2.5 rounded-xl transition-all min-h-[44px] flex items-center justify-center ${currentView === 'how-it-works' ? 'bg-gray-100 text-[#45a081]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'}`}
              title={t('nav.howItWorks')}
            >
              <HelpCircle size={22} strokeWidth={currentView === 'how-it-works' ? 2.5 : 2} />
            </button>
          )}

          <div className="relative" ref={langMenuRef}>
            <button onClick={(e) => { e.preventDefault(); setShowLangMenu(!showLangMenu); }} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 transition-all min-h-[44px]">
              <span className="text-xl">{currentLang.flag}</span>
              <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-2">
                  {languages.map((lang) => (
                    <button key={lang.code} onClick={(e) => { e.preventDefault(); handleLanguageChange(lang.code); }} className={`w-full px-4 py-4 text-left text-sm flex items-center justify-between transition-colors min-h-[44px] ${activeLangCode === lang.code ? 'bg-gray-50 text-black font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span className="flex items-center gap-3"><span className="text-lg">{lang.flag}</span><span>{lang.label}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!user ? (
            <button onClick={(e) => { e.preventDefault(); onSignUpClick && onSignUpClick(e); }} className="bg-black text-white px-4 md:px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 whitespace-nowrap min-h-[40px]">
              {t('nav.login')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {!isLocked && (
                <button onClick={(e) => { e.preventDefault(); onProfileClick(e); }} className={`w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden border-2 border-white shadow-md transition-transform hover:scale-105 active:scale-95 min-h-[40px] ${currentView === 'profile' ? 'ring-2 ring-indigo-500' : ''} ${userType === 'pro' ? 'bg-[#45a081]' : 'bg-[#2e75c2]'}`}>
                  {finalAvatarUrl ? <img src={finalAvatarUrl} alt="Profil" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white"><User size={18} /></div>}
                </button>
              )}
            </div>
          )}

          {/* Suppression de la liste déroulante (mobile menu) pour les non-connectés sur la landing page */}
          {!isLocked && user && !showPublicLinks && (
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2 text-gray-900 transition-all active:scale-90 min-h-[44px] flex items-center justify-center mobile-toggle-btn">
              {showMobileMenu ? <X size={26} strokeWidth={2.5} /> : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8"></line>
                  <line x1="4" x2="20" y1="16" y2="16"></line>
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {showMobileMenu && !isLocked && user && (
        <div ref={mobileMenuRef} className="lg:hidden absolute top-[calc(100%+12px)] right-4 w-[calc(100%-32px)] max-w-[320px] bg-white/95 backdrop-blur-2xl z-[5001] animate-in fade-in slide-in-from-top-8 duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top-right rounded-[36px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] border border-white/50 overflow-hidden ring-1 ring-black/5">
          <div className="p-3 space-y-2">
            {currentView !== 'auth' && !showPublicLinks && (
              <div className="space-y-1.5">
                {userType === 'expat' ? (
                  <>
                    <button 
                      style={{ animationDelay: '80ms' }}
                      onClick={handleMobileNav(onDashboardClick!)} 
                      className={`${mobileBtnBaseClass} ${mobileHoverClass} gap-3 ${currentView === 'expat-dashboard' ? 'bg-[#2e75c2]/10 text-[#2e75c2]' : 'bg-transparent text-gray-900'}`}
                    >
                       <Globe size={20} className={`group-hover:text-white transition-colors ${currentView === 'expat-dashboard' ? 'text-[#2e75c2]' : 'text-gray-400'}`} /> {t('nav.myRelocation')}
                    </button>
                    <button 
                      style={{ animationDelay: '120ms' }}
                      onClick={handleMobileNav(onAddCredits)} 
                      className={`${mobileBtnBaseClass} ${mobileHoverClass} gap-3 ${currentView === 'credits' ? 'bg-amber-500/10 text-amber-600' : 'bg-transparent text-gray-900'}`}
                    >
                       <Coins size={20} className={`group-hover:text-white transition-colors ${currentView === 'credits' ? 'text-amber-600' : 'text-gray-400'}`} /> {t('nav.buyCredits')} ({credits})
                    </button>
                  </>
                ) : userType === 'pro' ? (
                  <>
                    <button 
                      style={{ animationDelay: '80ms' }}
                      onClick={handleMobileNav(onDashboardClick!)} 
                      className={`${mobileBtnBaseClass} ${mobileHoverClass} gap-3 ${currentView === 'pro-dashboard' ? 'bg-[#45a081]/10 text-[#45a081]' : 'bg-transparent text-gray-900'}`}
                    >
                       <LayoutDashboard size={20} className={`group-hover:text-white transition-colors ${currentView === 'pro-dashboard' ? 'text-[#45a081]' : 'text-gray-400'}`} /> {t('nav.myBusiness')}
                    </button>
                    <button 
                      style={{ animationDelay: '160ms' }}
                      onClick={handleMobileNav(onSubscriptionClick!)} 
                      className={`${mobileBtnBaseClass} ${mobileHoverClass} gap-3 ${currentView === 'subscription' ? 'bg-[#2e75c2]/10 text-[#2e75c2]' : 'bg-transparent text-gray-900'}`}
                    >
                       <CreditCard size={20} className={`group-hover:text-white transition-colors ${currentView === 'subscription' ? 'text-[#2e75c2]' : 'text-gray-400'}`} /> {t('nav.plans')}
                    </button>
                  </>
                ) : null}
                <div className="pt-2 flex flex-col gap-1.5">
                   {isMultiRole && (
                     <button 
                        style={{ animationDelay: '240ms' }}
                        onClick={handleMobileNav((e) => onSwitchMode?.(userType === 'expat' ? 'pro' : 'expat', e))} 
                        className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-6 fill-mode-both duration-700 ease-out active:scale-95 transition-all hover:bg-black"
                      >
                       <ArrowRightLeft size={16} />
                       {userType === 'expat' ? t('nav.switchPro') : t('nav.switchExpat')}
                     </button>
                   )}
                   <button 
                      style={{ animationDelay: '320ms' }}
                      onClick={handleMobileNav(onProfileClick)} 
                      className="w-full py-4 bg-white border border-gray-100 rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-6 fill-mode-both duration-700 ease-out active:scale-95 transition-all shadow-sm hover:border-gray-300"
                    >
                     <User size={18} className="text-gray-400" /> {t('nav.myProfile')}
                   </button>
                   <button 
                      style={{ animationDelay: '400ms' }}
                      onClick={handleMobileNav(onLogout)} 
                      className="w-full py-3.5 text-red-500 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-50 rounded-[20px] animate-in fade-in slide-in-from-top-6 fill-mode-both duration-700 ease-out active:scale-95 transition-all"
                    >
                     <LogOut size={18} /> {t('nav.logout')}
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;