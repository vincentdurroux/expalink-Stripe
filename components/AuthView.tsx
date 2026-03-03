import React, { useState } from 'react';
import Logo from './Logo';
import { Mail, Lock, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

interface AuthViewProps {
  onAuthSuccess: () => void;
  onBack: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onBack }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isAccountNotFoundError, setIsAccountNotFoundError] = useState(false);

  const validateEmail = (e: string) => e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

  const handleContinue = (targetMode: 'signin' | 'signup') => {
    if (!email || !validateEmail(email)) {
      setStatusMessage({ type: 'info', text: t('auth.emailRequired') });
      return;
    }
    setStatusMessage(null);
    setIsAccountNotFoundError(false);
    setMode(targetMode);
    setStep('password');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setIsAccountNotFoundError(false);
    try {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        setStatusMessage({ type: 'error', text: error });
        setIsLoading(false);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: t('auth.genericError') });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      setStatusMessage({ type: 'info', text: t('auth.emailRequired') });
      setStep('email');
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { error } = await authService.resetPassword(email);
      if (error) {
        setStatusMessage({ type: 'error', text: t('notifications.resetError') });
      } else {
        setStatusMessage({ type: 'success', text: t('notifications.resetSent') });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: t('auth.genericError') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (step === 'email') {
      handleContinue(mode);
      return;
    }

    if (!password) { 
      return; 
    }
    
    setIsLoading(true);
    setStatusMessage(null);
    setIsAccountNotFoundError(false);

    try {
      if (mode === 'signup') {
        if (password.length < 6) { 
          setStatusMessage({ type: 'error', text: t('auth.passLength') }); 
          setIsLoading(false); 
          return; 
        }
        const { user, session, error } = await authService.signUp(email, password);
        if (error) { 
          setStatusMessage({ type: 'error', text: error }); 
          setIsLoading(false); 
        } else if (user) {
          if (!session) { 
            setStatusMessage({ type: 'info', text: `${t('auth.signUpSuccess')} ${t('auth.confirmEmail')}` }); 
            setIsLoading(false); 
          } else { 
            // On ne repasse PAS isLoading à false ici pour laisser le loader afficher
            onAuthSuccess(); 
          }
        }
      } else {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (!existingProfile) {
          setStatusMessage({ type: 'error', text: t('auth.accountNotFound') });
          setIsAccountNotFoundError(true);
          setIsLoading(false);
          return;
        }

        const { session, error } = await authService.signIn(email, password);
        if (error) { 
          setStatusMessage({ type: 'error', text: t('auth.invalidCreds') }); 
          setIsLoading(false); 
        } else { 
          // On ne repasse PAS isLoading à false ici
          onAuthSuccess(); 
        }
      }
    } catch (err: any) { 
      setStatusMessage({ type: 'error', text: err?.message || t('auth.genericError') }); 
      setIsLoading(false); 
    }
  };

  const handleGoBackToChoice = () => {
    setStep('email');
    setStatusMessage(null);
    setIsAccountNotFoundError(false);
  };

  const handleSwitchToSignup = () => {
    setMode('signup');
    setStep('password');
    setStatusMessage(null);
    setIsAccountNotFoundError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 md:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[50%] h-[50%] bg-emerald-50/60 rounded-full blur-[80px] md:blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] md:w-[50%] h-[50%] bg-indigo-50/60 rounded-full blur-[80px] md:blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        <button onClick={step === 'email' ? onBack : handleGoBackToChoice} className="mb-8 flex items-center gap-3 text-gray-400 hover:text-black font-semibold text-[11px] uppercase tracking-[0.2em] transition-all group px-2" disabled={isLoading}>
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          {step === 'email' ? t('common.back') : t('auth.changeEmail')}
        </button>

        <div className="bg-white border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] md:rounded-[48px] p-10 md:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="p-4 md:p-5 bg-white rounded-[24px] md:rounded-[28px] shadow-sm mb-8 md:mb-10 border border-gray-50"><Logo className="w-12 h-12 md:w-14 md:h-14" /></div>
            <h1 className="text-3xl md:text-4xl text-[#1d1d1f] font-bold tracking-tight mb-4 leading-tight">
              {step === 'email' ? t('auth.title') : (mode === 'signin' ? t('auth.signinTitle') : t('auth.signupTitle'))}
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-[280px] leading-relaxed font-medium">
              {step === 'email' ? t('auth.subtitle') : (mode === 'signin' ? t('auth.signinSubtitle') : t('auth.signupSubtitle'))}
            </p>
          </div>

          <div className="space-y-8">
            <form className="space-y-8" onSubmit={handleAuth}>
              {step === 'email' ? (
                <div className="space-y-8">
                  {/* GOOGLE LOGIN FIRST */}
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-4 w-full bg-white border-2 border-gray-100 text-gray-900 py-4 px-6 rounded-[22px] font-bold text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin text-gray-400" size={20} />
                    ) : (
                      <>
                        <img 
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                          alt="Google" 
                          className="w-5 h-5" 
                        />
                        {t('auth.googleBtn')}
                      </>
                    )}
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <span className="relative px-4 bg-white text-[10px] font-semibold text-gray-300 uppercase tracking-widest">{t('common.or')}</span>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 ml-5 font-semibold">{t('auth.email')}</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors z-10" size={20} />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-[22px] pl-16 pr-6 py-5 text-lg outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-medium" placeholder={t('auth.emailPlaceholder')} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button type="button" onClick={() => handleContinue('signin')} className="w-full bg-black text-white py-6 rounded-[24px] text-sm md:text-base font-bold hover:bg-gray-800 shadow-xl transition-all flex items-center justify-center gap-3">{t('auth.continueLogin')} <ChevronRight size={20} className="opacity-50" /></button>
                    <button type="button" onClick={() => handleContinue('signup')} className="w-full bg-white border-2 border-gray-100 text-gray-900 py-6 rounded-[24px] text-sm md:text-base font-bold hover:bg-gray-50 transition-all"> {t('auth.continueSignup')}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-5"><label className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">{t('auth.pass')}</label><span className="text-[10px] font-semibold text-indigo-500 lowercase opacity-60 truncate max-w-[150px]">{email}</span></div>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors z-10" size={20} />
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoFocus className="w-full bg-gray-50/50 border border-gray-100 rounded-[22px] pl-16 pr-16 py-5 text-lg outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all font-medium" placeholder={t('auth.passPlaceholder')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black p-2 z-20">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                    </div>
                    {mode === 'signin' && (
                      <div className="flex justify-end px-2 pt-0.5">
                        <button 
                          type="button" 
                          onClick={handleForgotPassword}
                          disabled={isLoading}
                          className="text-[9px] font-medium text-gray-400 hover:text-indigo-500 transition-colors py-1"
                        >
                          {t('auth.forgotPass')}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <button type="submit" disabled={isLoading} className={`w-full ${mode === 'signup' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-black hover:bg-gray-800'} text-white py-6 rounded-[24px] text-sm md:text-base font-bold shadow-2xl transition-all flex items-center justify-center gap-3`}>
                      {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>{mode === 'signin' ? t('auth.loginBtn') : t('auth.signupBtn')}<ShieldCheck size={20} className="opacity-50" /></>}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {statusMessage && (
            <div className={`mt-10 p-5 rounded-[28px] border-2 animate-in slide-in-from-top-2 duration-500 ${statusMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-900' : (statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-blue-50 border-blue-100 text-blue-900')}`}>
              <div className={`flex items-center justify-center gap-4 ${isAccountNotFoundError && mode === 'signin' ? 'flex-col' : ''}`}>
                <div className={`p-2 rounded-xl bg-white shadow-sm shrink-0 ${statusMessage.type === 'error' ? 'text-red-600' : (statusMessage.type === 'success' ? 'text-emerald-600' : 'text-blue-600')}`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex flex-col justify-center text-center">
                  <p className="text-[12px] font-bold leading-tight">
                    {statusMessage.text}
                  </p>
                  
                  {isAccountNotFoundError && mode === 'signin' && (
                    <div className="flex flex-col items-center mt-6 w-full">
                      <button 
                        onClick={handleSwitchToSignup}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-[11px] font-bold hover:bg-red-700 transition-all shadow-lg active:scale-95 group mx-auto"
                      >
                        <UserPlus size={16} className="group-hover:scale-110 transition-transform" />
                        {t('auth.suggestSignup')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;