import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';
import { authService } from './services/authService';
import { 
  getUserProfile, 
  updateUserProfile, 
  setUserRole, 
  deleteUserProfile, 
  getUnlockedPros, 
  getUserReviews, 
  saveUnlock, 
  updateUserCredits, 
  submitProfessionalReview, 
  updateUserPlan,
  incrementProfileUnlocks,
  getProfessionalsWithDistance,
  cancelUserPlan,
  reactivateUserPlan,
  mapDBRowToPro,
  PRO_MINIMAL_COLUMNS,
  PRO_PRIVATE_COLUMNS,
  setPremiumStatus
} from './services/userService';
import { supabase } from './supabaseClient';
import GlobalBackground from './components/GlobalBackground';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import HowItWorks from './components/HowItWorks';
import CreditsPage from './components/CreditsPage';
import AuthView from './components/AuthView';
import ExpatHome from './components/ExpatHome';
import ProHome from './components/ProHome';
import ExpatDashboard from './components/ExpatDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import ProfilePage from './components/ProfilePage';
import ProSubscriptionPage from './components/ProSubscriptionPage';
import AdminPage from './components/AdminPage';
import Footer from './components/Footer';
import ProfileModal from './components/ProfileModal';
import ConfirmationModal from './components/ConfirmationModal';
import Toast, { ToastType } from './components/Toast';
import { Professional, UnlockToken, Review, SearchFilters, UserType } from './types';
import { useTranslation } from 'react-i18next';

const LIBRARIES: Libraries = ['places'];
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // États de données
  const [user, setUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [unlockedPros, setUnlockedPros] = useState<Record<string, UnlockToken>>({});
  const [unlockedProfessionalList, setUnlockedProfessionalList] = useState<Professional[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  
  // États d'UI
  const [currentView, setCurrentView] = useState<string>('landing');
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessingAuth, setIsProcessingAuth] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Professional[] | null>(null);
  const [searchOriginName, setSearchOriginName] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<UserType | null>(null);
  const [isRoleSwitchLoading, setIsRoleSwitchLoading] = useState<boolean>(false);
  const [pendingUnlockId, setPendingUnlockId] = useState<string | null>(null);
  const [isUnlockingLoading, setIsUnlockingLoading] = useState<boolean>(false);
  
  // Contrôle du mode édition direct du Dashboard Pro
  const [proDashboardEditMode, setProDashboardEditMode] = useState<boolean>(false);

  // Verrous pour empêcher les appels multiples
  const isFetchingRef = useRef<string | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);

  // FIX: Stable Google Maps Options
  const initialLang = useMemo(() => i18n.language ? i18n.language.split('-')[0] : 'en', []);
  
  const googleMapsOptions = useMemo(() => {
    return {
      id: 'google-map-script',
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
      libraries: LIBRARIES,
      language: initialLang,
      region: 'es'
    };
  }, [initialLang]);

  const { isLoaded, loadError } = useJsApiLoader(googleMapsOptions);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentView]);

  useEffect(() => { 
    if (isLoaded) window.dispatchEvent(new CustomEvent('google-maps-loaded')); 
  }, [isLoaded]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Geolocation denied."),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    if (isFetchingRef.current === userId) return;
    isFetchingRef.current = userId;

    try {
      const profile = await getUserProfile(userId);
      if (profile) {
        const [unlocked, reviews] = await Promise.all([
          getUnlockedPros(userId).catch(() => ({})),
          getUserReviews(userId).catch(() => [])
        ]);
        
        setDbProfile(profile);
        setCredits(profile.credits || 0);
        setIsPremium(!!profile.is_premium);
        setUnlockedPros(unlocked || {});
        setUserReviews(reviews || []);
        lastFetchedUserId.current = userId;
        
        if (profile.role_selected) {
          // Enforcement logic for pro profile completion after login
          if (profile.is_pro) {
            if (!profile.is_pro_complete) {
              setProDashboardEditMode(true);
              setCurrentView('pro-dashboard');
            } else {
              setCurrentView('pro-home');
            }
          } else {
            setCurrentView('expat-home');
          }
        } else if (currentView === 'auth') {
          setCurrentView('landing');
        }
      }
    } catch (err: any) {
      console.error("Critical error loading user data:", err);
      setLoading(false);
      setIsProcessingAuth(false);
    } finally {
      isFetchingRef.current = null;
    }
  }, [currentView]);

  const clearUserData = useCallback(() => {
    lastFetchedUserId.current = null;
    isFetchingRef.current = null;
    setUser(null);
    setDbProfile(null);
    setCredits(0);
    setIsPremium(false);
    setUnlockedPros({});
    setUnlockedProfessionalList([]);
    setUserReviews([]);
    const publicViews = ['landing', 'auth'];
    if (!publicViews.includes(currentView)) {
      setCurrentView('landing');
    }
  }, [currentView]);

  useEffect(() => {
    let isMounted = true;

    const performAuthSync = async (session: any) => {
      if (!isMounted) return;
      
      if (!session?.user) {
        clearUserData();
        setLoading(false);
        setIsProcessingAuth(false);
        return;
      }

      const userId = session.user.id;
      setUser(session.user);
      
      if (userId !== lastFetchedUserId.current) {
        setIsProcessingAuth(true);
        await loadUserData(userId);
        setIsProcessingAuth(false);
      }
      
      setLoading(false);
    };

    authService.getSession().then(session => {
      performAuthSync(session);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    const subscription = authService.onAuthStateChange(async (session) => {
      performAuthSync(session);
    });

    return () => { 
      isMounted = false; 
      subscription?.unsubscribe(); 
    };
  }, [loadUserData, clearUserData]);

  const unlockedIdsString = useMemo(() => Object.keys(unlockedPros).sort().join(','), [unlockedPros]);
  
  useEffect(() => {
    const fetchUnlockedDetails = async () => {
      const ids = Object.keys(unlockedPros);
      if (ids.length === 0) { 
        setUnlockedProfessionalList([]); 
        return; 
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`${PRO_MINIMAL_COLUMNS}, ${PRO_PRIVATE_COLUMNS}`)
          .in('id', ids);
        
        if (error) throw error;
        if (data) setUnlockedProfessionalList(data.map(mapDBRowToPro));
      } catch (err: any) { 
        console.error("Error fetching unlocked pros details:", err); 
      }
    };

    if (user?.id && unlockedIdsString) {
      fetchUnlockedDetails();
    }
  }, [unlockedIdsString, user?.id]);

  const handleSearchSubmit = async (filters: SearchFilters & { lat?: number; lng?: number; locationName?: string }) => {
    setIsSearching(true);
    setSearchOriginName(filters.locationName || '');
    setSearchResults([]); 
    try {
      const results = await getProfessionalsWithDistance(filters.lat || 0, filters.lng || 0, filters.profession, filters.language, filters.city);
      setSearchResults(results);
      setTimeout(() => { 
        document.getElementById('search-results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
      }, 100);
    } catch (e: any) { 
       console.error(e);
       setToast({ message: e.message || "Search failed.", type: 'error' });
    } finally { setIsSearching(false); }
  };

  const handleUnlock = (proId: string) => {
    if (isPremium) return;
    if (!user) { setSelectedPro(null); setCurrentView('auth'); return; }
    if (credits < 1) { setSelectedPro(null); setCurrentView('credits'); return; }
    setPendingUnlockId(proId);
  };

  const handleConfirmUnlock = async () => {
    if (!pendingUnlockId || !user) return;
    setIsUnlockingLoading(true);
    try {
      await saveUnlock(user.id, pendingUnlockId);
      const newCredits = credits - 1;
      await updateUserCredits(user.id, newCredits);
      setCredits(newCredits);
      const unlocked = await getUnlockedPros(user.id);
      setUnlockedPros(unlocked);
      await incrementProfileUnlocks(pendingUnlockId);
      setToast({ message: t('notifications.unlocked'), type: 'success' });
      setPendingUnlockId(null);
    } catch (e: any) { 
      console.error("Unlock process failed:", e);
      setToast({ message: e.message?.includes('duplicate') ? "Expert already unlocked." : t('notifications.unlockError'), type: 'error' }); 
    } finally { setIsUnlockingLoading(false); }
  };

  const handleLogout = async () => { 
    try {
      await authService.signOut(); 
      setToast({ message: t('notifications.logoutSuccess'), type: 'success' }); 
      clearUserData();
    } catch (e) {
      clearUserData();
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;
    try {
      await deleteUserProfile(user.id);
      await authService.signOut();
      setToast({ message: t('notifications.accountDeleted'), type: 'success' });
      clearUserData();
    } catch (err: any) {
      setToast({ message: err.message || "Error deleting account", type: 'error' });
    }
  };

  // FIX DU FLICKER : On garde le loader tant que le profil de l'utilisateur connecté n'est pas arrivé
  if (loading || isProcessingAuth || (user && !dbProfile)) return null;
  if (loadError) return <div className="min-h-screen flex items-center justify-center p-10"><p className="font-bold text-red-500">Error loading Google Maps.</p></div>;

  return (
    <div className="min-h-screen relative">
      <GlobalBackground />
      <Header 
        user={user} profile={dbProfile} credits={credits} isPremium={isPremium}
        onAddCredits={() => setCurrentView('credits')} userType={dbProfile?.is_pro ? 'pro' : (dbProfile?.is_expat ? 'expat' : null)} 
        onLogout={handleLogout} onLogoClick={() => setCurrentView(dbProfile?.role_selected ? (dbProfile.is_pro ? 'pro-home' : 'expat-home') : 'landing')} 
        onHowItWorksClick={() => setShowHowItWorks(true)} 
        onDashboardClick={() => { setProDashboardEditMode(false); setCurrentView(dbProfile?.is_pro ? 'pro-dashboard' : 'expat-dashboard'); }} 
        onProfileClick={() => setCurrentView('profile')} onSignUpClick={() => setCurrentView('auth')} 
        onSubscriptionClick={() => setCurrentView('subscription')} currentView={currentView} 
        onSwitchMode={(target) => setPendingRoleSwitch(target)} onAdminClick={() => setCurrentView('admin')}
      />
      <main className="min-h-[calc(100vh-80px)]">
        {currentView === 'landing' && (
          <LandingPage 
            onSignUp={(role) => {
              if (!user) { setCurrentView('auth'); } else {
                if (!dbProfile?.role_selected || (role === 'pro' && !dbProfile.is_pro) || (role === 'expat' && !dbProfile.is_expat)) {
                  setPendingRoleSwitch(role);
                } else {
                  if (role === 'pro') setCurrentView('subscription');
                  else setCurrentView('expat-home');
                }
              }
            }} 
            onSearch={handleSearchSubmit} onLearnEarlyMember={() => { if (!user) setCurrentView('auth'); else setCurrentView('subscription'); }} 
            searchResults={searchResults} searchOriginName={searchOriginName} onClearSearch={() => setSearchResults(null)} 
            isSearching={isSearching} onUnlock={handleUnlock} isAuth={!!user} hasRoleSelected={!!dbProfile?.role_selected} 
            onViewProfile={setSelectedPro} currentUserId={user?.id} unlockedPros={unlockedPros} userCoords={userCoords} 
          />
        )}
        {currentView === 'credits' && <CreditsPage currentCredits={credits} isAuth={!!user} isRoleSelected={!!dbProfile?.role_selected} userId={user?.id} userEmail={user?.email} onAuthRequired={() => setCurrentView('auth')} onPurchase={async (amount: number, isPremiumPurchase?: boolean) => { try { if (!user) return; if (isPremiumPurchase) { await setPremiumStatus(user.id); setIsPremium(true); } else { const nc = credits + amount; await updateUserCredits(user.id, nc); setCredits(nc); } setCurrentView(dbProfile.is_pro ? 'pro-home' : 'expat-home'); } catch(e) { setToast({message: "Purchase update failed.", type: 'error'}); } }} onBack={() => setCurrentView(dbProfile?.role_selected ? (dbProfile.is_pro ? 'pro-dashboard' : 'expat-dashboard') : 'landing')} />}
        {currentView === 'auth' && <AuthView onAuthSuccess={() => {}} onBack={() => setCurrentView('landing')} />}
        {currentView === 'profile' && <ProfilePage user={user} profile={dbProfile} userType={dbProfile?.is_pro ? 'pro' : 'expat'} onUpdateProfile={async (data) => { if (!user) return; try { const u = await updateUserProfile(user.id, data); setDbProfile(u); } catch(e) { setToast({message: "Update failed.", type: 'error'}); } }} onSwitchRole={setPendingRoleSwitch as any} onDeleteProfile={handleDeleteProfile} onBack={() => setCurrentView(dbProfile?.role_selected ? (dbProfile.is_pro ? 'pro-home' : 'expat-home') : 'landing')} onLogout={handleLogout} onAdminAccess={() => setCurrentView('admin')} />}
        {currentView === 'admin' && <AdminPage onBack={() => setCurrentView('profile')} />}
        {currentView === 'expat-home' && <ExpatHome userName={dbProfile?.full_name} credits={credits} unlockedCount={Object.keys(unlockedPros).length} onSearch={handleSearchSubmit} onGoToDashboard={() => setCurrentView('expat-dashboard')} onAddCredits={() => setCurrentView('credits')} onSwitchToPro={() => setPendingRoleSwitch('pro')} searchResults={searchResults} searchOriginName={searchOriginName} onClearSearch={() => setSearchResults(null)} unlockedPros={unlockedPros} onUnlock={handleUnlock} isSearching={isSearching} onViewProfile={setSelectedPro} onMessagePro={() => {}} onSetSearchResults={setSearchResults} currentUserId={user?.id} allRealPros={[]} profile={dbProfile} onAdminClick={() => setCurrentView('admin')} userCoords={userCoords} />}
        {currentView === 'pro-home' && (
          <ProHome 
            userName={dbProfile?.full_name} profile={dbProfile} onGoToDashboard={() => { setProDashboardEditMode(false); setCurrentView('pro-dashboard'); }} 
            onEditProfile={() => { setProDashboardEditMode(true); setCurrentView('pro-dashboard'); }} onUpgrade={() => setCurrentView('subscription')} 
            onSwitchToExpat={() => setPendingRoleSwitch('expat')} onViewProfile={setSelectedPro} onAdminClick={() => setCurrentView('admin')} 
          />
        )}
        {currentView === 'pro-dashboard' && <ProfessionalDashboard profile={dbProfile} currentPlan={dbProfile?.pro_plan} planStatus={dbProfile?.plan_status} subscriptionEndsAt={dbProfile?.subscription_ends_at} cancelAtPeriodEnd={dbProfile?.cancel_at_period_end} onUpgradeClick={() => setCurrentView('subscription')} onViewProfile={setSelectedPro} onBack={() => setCurrentView('pro-home')} onCancelPlan={async () => { if (!user) return; try { const u = await cancelUserPlan(user.id); setDbProfile(u); } catch(e) { setToast({message: "Action failed.", type: 'error'}); } }} onReactivatePlan={async () => { if (!user) return; try { const u = await reactivateUserPlan(user.id); setDbProfile(u); } catch(e) { setToast({message: "Action failed.", type: 'error'}); } }} onUpdateProfile={async (d) => { if (!user) return; try { const u = await updateUserProfile(user.id, d); setDbProfile(u); } catch(e) { setToast({message: "Update failed.", type: 'error'}); } }} onUpdateComplete={async (d) => { if (!user) return; try { const updated = await updateUserProfile(user.id, d); setDbProfile(updated); setToast({message: t('notifications.profileSaved'), type: 'success'}); setCurrentView('pro-home'); } catch(e) { setToast({message: "Saving failed.", type: 'error'}); } }} initialEditMode={proDashboardEditMode} />}
        {currentView === 'expat-dashboard' && <ExpatDashboard credits={credits} unlockedPros={unlockedPros} unlockedProfessionalList={unlockedProfessionalList} userReviews={userReviews} preferredCity={dbProfile?.preferred_city || ''} onUpdateCity={() => {}} onFindPros={() => setCurrentView('expat-home')} onAddCredits={() => setCurrentView('credits')} onMessagePro={() => {}} onSubmitReview={async (p, s, t, st, a) => { if (!user) return; try { await submitProfessionalReview(user.id, p, s, t, st, a); const r = await getUserReviews(user.id); setUserReviews(r); } catch(e) { setToast({message: "Review submission failed.", type: 'error'}); } }} onSwitchToPro={() => setPendingRoleSwitch('pro')} onViewProfile={setSelectedPro} onBack={() => setCurrentView('expat-home')} onTriggerSearch={() => {}} userCoords={userCoords} />}
        {currentView === 'subscription' && <ProSubscriptionPage profile={dbProfile} onSelect={async (p) => { if (!user) return; try { const u = await updateUserPlan(user.id, p); setDbProfile(u); setCurrentView('pro-home'); } catch(e) { setToast({message: "Plan activation failed.", type: 'error'}); } }} onBack={() => setCurrentView('pro-home')} currentPlan={dbProfile?.pro_plan} onGoToEdit={() => { setProDashboardEditMode(true); setCurrentView('pro-dashboard'); }} onReactivate={async () => { if (!user) return; try { const u = await reactivateUserPlan(user.id); setDbProfile(u); setToast({message: t('notifications.profileSaved'), type: 'success'}); setCurrentView('pro-home'); } catch(e) { setToast({message: "Action failed.", type: 'error'}); } }} />}
      </main>
      
      {showHowItWorks && <HowItWorks onClose={() => setShowHowItWorks(false)} />}
      
      {selectedPro && <ProfileModal pro={selectedPro} isUnlocked={!!unlockedPros[selectedPro.id]} isAuth={!!user} isPremium={isPremium} isOwner={user?.id === selectedPro.id} currentUserId={user?.id} onClose={() => setSelectedPro(null)} onUnlock={handleUnlock} userCoords={userCoords} />}
      {pendingRoleSwitch && <ConfirmationModal isOpen={!!pendingRoleSwitch} onClose={() => setPendingRoleSwitch(null)} onConfirm={async () => { if (!pendingRoleSwitch) return; setIsRoleSwitchLoading(true); try { const u = await setUserRole(pendingRoleSwitch); setDbProfile(u); if (pendingRoleSwitch === 'pro') { if (!u.is_pro_complete) { setProDashboardEditMode(true); setCurrentView('pro-dashboard'); } else { setCurrentView('pro-home'); } } else { setCurrentView('expat-home'); } } catch(e) { setToast({message: "Switch failed.", type: 'error'}); } finally { setIsRoleSwitchLoading(false) ; setPendingRoleSwitch(null); } }} isLoading={isRoleSwitchLoading} title={pendingRoleSwitch === 'pro' ? t('profile.switchToProTitle') : t('profile.switchToExpatTitle')} message={pendingRoleSwitch === 'pro' ? t('profile.switchToProMsg') : t('profile.switchToExpatMsg')} confirmLabel={t('common.confirm')} type={pendingRoleSwitch === 'pro' ? 'pro' : 'expat'} />}
      {pendingUnlockId && <ConfirmationModal isOpen={!!pendingUnlockId} onClose={() => setPendingUnlockId(null)} onConfirm={handleConfirmUnlock} isLoading={isUnlockingLoading} title={t('common.unlock')} message={t('common.confirmUnlock')} confirmLabel={t('common.confirm')} type="pro" />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {!(currentView === 'landing' && user && !dbProfile?.role_selected) && <Footer />}
    </div>
  );
};

export default App;
