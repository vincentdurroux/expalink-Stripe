import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ArrowLeft, Edit3, Save, Loader2, Camera, AlertTriangle, Lock, ShieldCheck, Eye, EyeOff, KeyRound, ShieldAlert, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserType } from '../types';
import { getUserProfile, compressAndUploadImage } from '../services/userService';
import { authService } from '../services/authService';
import ConfirmationModal from './ConfirmationModal';
import Toast, { ToastType } from './Toast';

interface ProfilePageProps {
  user: any; 
  profile?: any;
  userType: UserType | null; 
  onUpdateProfile: (data: any) => Promise<void>; 
  onSwitchRole: (targetRole: UserType) => Promise<void>; 
  onDeleteProfile: () => Promise<void>; 
  onBack: () => void; 
  onLogout: () => void;
  onAdminAccess?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, profile, userType, onUpdateProfile, onDeleteProfile, onBack, onLogout, onAdminAccess }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!profile);
  const [dbProfile, setDbProfile] = useState<any>(profile);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({ 
    name: profile?.full_name || '', 
    avatar_url: profile?.avatar_url || '' 
  });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  // Synchronisation immédiate si le profil arrive par les props
  useEffect(() => {
    if (profile) {
      setDbProfile(profile);
      setEditData({ name: profile.full_name || '', avatar_url: profile.avatar_url || '' });
      setIsLoadingProfile(false);
    }
  }, [profile]);

  // Chargement de secours si profile est manquant
  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile && user?.id) {
        setIsLoadingProfile(true);
        try {
          const data = await getUserProfile(user.id);
          if (data) { 
            setDbProfile(data); 
            setEditData({ name: data.full_name || '', avatar_url: data.avatar_url || '' }); 
          }
        } catch (err) {
          console.error("[ProfilePage] Failed to fetch profile:", err);
          setToast({ message: "Failed to load profile data", type: 'error' });
        } finally {
          setIsLoadingProfile(false); 
        }
      }
    };
    fetchProfile();
  }, [user?.id, profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      setIsSaving(true);
      try {
        const publicUrl = await compressAndUploadImage(file, 'avatars', user.id, 'personal_avatar');
        setEditData(prev => ({ ...prev, avatar_url: publicUrl }));
        setToast({ message: "Avatar uploaded", type: 'success' });
      } catch (err) {
        setToast({ message: "Upload failed", type: 'error' });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditData(prev => ({ ...prev, avatar_url: '' }));
    setToast({ message: "Avatar removed locally. Click Save to confirm.", type: 'info' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { full_name: editData.name, avatar_url: editData.avatar_url };
      await onUpdateProfile(payload); 
      setDbProfile((prev: any) => ({ ...prev, ...payload })); 
      setIsEditing(false);
      setToast({ message: t('notifications.profileSaved'), type: 'success' });
    } catch (err) {
      setToast({ message: "Update failed", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPass) return;
    if (!oldPassword || !newPassword || !confirmPassword) { setToast({ message: t('auth.fillFields'), type: 'error' }); return; }
    if (newPassword.length < 6) { setToast({ message: t('auth.passLength'), type: 'error' }); return; }
    if (newPassword !== confirmPassword) { setToast({ message: t('notifications.passwordMismatch'), type: 'error' }); return; }

    setIsUpdatingPass(true);
    try {
      const { error: loginError } = await authService.signIn(user.email, oldPassword);
      if (loginError) { setToast({ message: t('notifications.oldPasswordIncorrect'), type: 'error' }); return; }
      const { error: updateError = null } = await authService.updatePassword(newPassword);
      if (updateError) setToast({ message: updateError, type: 'error' });
      else {
        setToast({ message: t('notifications.passwordChanged'), type: 'success' });
        setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch (err) {
      setToast({ message: "System error during password change", type: 'error' });
    } finally { setIsUpdatingPass(false); }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.loading')}</p>
      </div>
    );
  }

  const isAdmin = dbProfile?.is_admin === true;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-40 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-black font-bold text-sm transition-colors"><ArrowLeft size={16} /> {t('common.back')}</button>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} disabled={isSaving} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${isEditing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-black text-white hover:bg-gray-800'}`}>
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : isEditing ? <Save size={14} /> : <Edit3 size={14} />} {isEditing ? t('profile.save') : t('profile.edit')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="apple-card p-8 border border-gray-100 bg-white text-center shadow-sm">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-xl bg-gray-100 mx-auto mb-6 relative group">
              {editData.avatar_url ? (
                <img src={editData.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-400">
                  <User size={40} />
                </div>
              )}
              
              {isEditing && (
                <>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change photo"
                  >
                    <Camera size={20} />
                  </button>
                  {editData.avatar_url && (
                    <button 
                      onClick={handleRemoveAvatar} 
                      className="absolute top-1 right-1 bg-white text-red-500 p-2 rounded-full shadow-2xl border border-red-50 hover:bg-red-500 hover:text-white transition-all z-20 active:scale-90"
                      title="Remove photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 truncate">{isEditing ? <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full text-center bg-gray-50 border border-gray-100 rounded-xl p-2 outline-none font-bold" /> : editData.name}</h2>
            <p className="text-sm text-gray-400 mb-6 font-bold truncate">{user?.email}</p>
            <div className="flex flex-col gap-2">
              {!dbProfile?.role_selected ? (<div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase border border-gray-200">{t('profile.roleNotSelected')}</div>) : dbProfile?.is_pro ? (<div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase border border-emerald-100">{t('profile.proProfile')}</div>) : (<div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase border border-indigo-100">{t('profile.expatProfile')}</div>)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="apple-card p-8 border border-gray-100 bg-white space-y-8 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-[0.2em]">{t('profile.personalDetails')}</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">{t('profile.joinedOn')}</div>
                <div className="text-base font-bold text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : t('common.na')}</div>
              </div>
            </div>
          </div>

          <div className="apple-card p-8 border border-gray-100 bg-white space-y-8 shadow-sm">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20} /></div><h3 className="text-xs font-bold uppercase text-gray-400 tracking-[0.2em]">{t('profile.securityTitle')}</h3></div>
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2"><label className="text-xs font-bold text-gray-400 ml-1">{t('profile.oldPassword')}</label><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type={showPass ? "text" : "password"} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-base font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300" placeholder="••••••••" /></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 ml-1">{t('profile.newPassword')}</label><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-11 py-3 text-base font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300" placeholder="••••••••" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 ml-1">{t('profile.confirmPassword')}</label><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={16} /><input type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-base font-bold focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-gray-300" placeholder="••••••••" /></div></div>
              </div>
              <button type="submit" disabled={isUpdatingPass || !oldPassword || !newPassword || !confirmPassword} className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg">{isUpdatingPass ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}{t('profile.updatePasswordBtn')}</button>
            </form>
          </div>

          <div className="apple-card p-8 border border-red-100 bg-red-50/20 shadow-sm">
            <div className="flex items-center gap-3 mb-4"><AlertTriangle size={20} className="text-red-500" /><h3 className="text-base font-bold uppercase text-red-600 tracking-wider">{t('profile.dangerZone')}</h3></div>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">{t('profile.deleteAccount')}</p>
            <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl text-xs font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm active:scale-95">{t('profile.deleteBtn')}</button>
          </div>

          <div className="pt-16 flex flex-col items-center gap-8">
            {isAdmin && onAdminAccess && (<div className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-1000 delay-300"><button onClick={onAdminAccess} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 rounded-[22px] font-bold text-sm tracking-tight transition-all active:scale-95 group"><ShieldAlert size={18} className="opacity-60 group-hover:opacity-100 transition-all" />{t('admin.title')}</button><p className="mt-3 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">Accès privilégié réservé à l'équipe ExpaLink</p></div>)}
            <button onClick={onLogout} className="flex items-center gap-3 text-base font-bold text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /> {t('nav.logout')}</button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmationModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={onDeleteProfile} title={t('profile.deleteConfirmTitle')} message={userType === 'pro' ? t('profile.deleteConfirmMessagePro') : t('profile.deleteConfirmMessageExpat')} confirmLabel={t('profile.deleteBtn')} type="expat" requireTextConfirmation="delete" />
    </div>
  );
};

export default ProfilePage;