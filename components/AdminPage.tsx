import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ShieldCheck, 
  UserCheck, 
  MessageSquare, 
  LifeBuoy, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Mail, 
  User, 
  Star, 
  AlertCircle,
  Loader2,
  ExternalLink,
  FileText,
  FileSearch,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  MessageSquareQuote,
  X,
  Save,
  ShieldAlert,
  Briefcase,
  MapPin,
  Globe,
  Phone,
  Languages,
  User2,
  Building2,
  // Added missing Award icon import
  Award
} from 'lucide-react';
import { Professional, VerificationStatus, ReviewStatus } from '../types';
import { getPendingVerificationProfiles, updateExpertVerificationStatus, getAllReviewsForAdmin, updateReviewStatus, updateReviewText, getSupportMessages, getPendingProfiles, updateProfileStatus } from '../services/userService';
import Toast, { ToastType } from './Toast';
import { getFlagEmoji, LANGUAGE_FLAGS } from '../constants';
import { useTranslation } from 'react-i18next';

type AdminTab = 'verification' | 'moderation' | 'support' | 'profiles';

const AdminPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('profiles');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  // Data states
  const [pendingDocs, setPendingDocs] = useState<Professional[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<Professional[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);

  // Editing state for reviews
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState<string>('');

  // Modal state for profile rejection
  const [profileRejectModal, setProfileRejectModal] = useState<{ pro: Professional, reason: string } | null>(null);

  const loadAllData = async () => {
    try {
      const [vData, pData, rData, sData] = await Promise.all([
        getPendingVerificationProfiles(),
        getPendingProfiles(),
        getAllReviewsForAdmin(),
        getSupportMessages()
      ]);
      setPendingDocs(vData);
      setPendingProfiles(pData);
      setReviews(rData);
      setSupportMessages(sData);
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.is_admin) {
          setIsAdmin(true);
          await loadAllData();
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  const handleUpdateDocs = async (uid: string, status: VerificationStatus) => {
    setActionLoading(uid);
    try {
      await updateExpertVerificationStatus(uid, status);
      setPendingDocs(prev => prev.filter(p => p.id !== uid));
      setToast({ 
        message: status === 'verified' ? "Identity approved" : "Identity rejected", 
        type: 'success' 
      });
    } catch (err) {
      setToast({ message: "Action failed", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProfile = async (uid: string, status: 'approved' | 'rejected', reason?: string) => {
    setActionLoading(uid);
    try {
      await updateProfileStatus(uid, status, reason);
      setPendingProfiles(prev => prev.filter(p => p.id !== uid));
      setToast({ 
        message: status === 'approved' ? "Profile fully approved and live" : "Profile rejected", 
        type: 'success' 
      });
      if (status === 'rejected') setProfileRejectModal(null);
    } catch (err) {
      setToast({ message: "Action failed", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveReviewText = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await updateReviewText(reviewId, editingReviewText);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, testimonies: editingReviewText } : r));
      setEditingReviewId(null);
      setToast({ message: "Review content updated", type: 'success' });
    } catch (err) {
      setToast({ message: "Update failed", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReview = async (reviewId: string, status: ReviewStatus) => {
    setActionLoading(reviewId);
    try {
      const isCurrentlyEditing = editingReviewId === reviewId;
      const textToSave = isCurrentlyEditing ? editingReviewText : undefined;
      
      await updateReviewStatus(reviewId, status, textToSave);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setToast({ 
        message: status === 'verified' ? "Review published" : "Review rejected", 
        type: 'success' 
      });
      if (isCurrentlyEditing) {
        setEditingReviewId(null);
        setEditingReviewText('');
      }
    } catch (err) {
      setToast({ message: "Action failed", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const startEditingReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.testimonies);
  };

  if (loading && isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-base font-bold text-gray-400 uppercase tracking-widest">Accessing database...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Restricted Access</h1>
        <p className="text-gray-500 font-bold mb-10 max-w-xs text-center text-lg">This section is strictly reserved for ExpaLink administrators.</p>
        <button onClick={onBack} className="bg-black text-white px-10 py-5 rounded-2xl font-bold text-base shadow-xl active:scale-95 transition-all">Back to Home</button>
      </div>
    );
  }

  const NavButton = ({ tab, icon: Icon, label, count, color = 'bg-indigo-500' }: { tab: AdminTab, icon: any, label: string, count: number, color?: string }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-3 p-3 lg:p-4 rounded-2xl transition-all relative group whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
    >
      <Icon size={24} />
      <span className="font-bold text-sm lg:text-base">{label}</span>
      {count > 0 && (
        <span className={`ml-1 flex w-6 h-6 ${activeTab === tab ? color : 'bg-gray-300 group-hover:bg-indigo-400'} text-white rounded-full text-[10px] items-center justify-center font-bold shadow-sm shrink-0`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row pt-16 md:pt-20">
      <aside className="w-full lg:w-80 bg-white border-b lg:border-r border-gray-100 flex flex-col shrink-0 lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] z-40">
        <nav className="flex flex-row lg:flex-col p-4 lg:p-6 space-x-3 lg:space-x-0 lg:space-y-3 lg:pt-10 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <NavButton tab="profiles" icon={UserCheck} label="Pro Listings" count={pendingProfiles.length} />
          <NavButton tab="verification" icon={ShieldAlert} label="ID Documents" count={pendingDocs.length} />
          <NavButton tab="moderation" icon={MessageSquare} label="Reviews" count={reviews.length} color="bg-amber-500" />
          <NavButton tab="support" icon={LifeBuoy} label="Support" count={supportMessages.length} />
          
          <div className="hidden lg:block pt-6 border-t border-gray-50 mt-6">
             <button onClick={onBack} className="w-full flex items-center gap-4 p-4 text-gray-400 hover:text-black transition-all">
               <ArrowLeft size={24} />
               <span className="font-bold text-base">Back</span>
             </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 xl:p-20 overflow-y-auto">
        <header className="mb-10 lg:mb-14">
            <h2 className="text-3xl lg:text-5xl font-bold text-[#1d1d1f] tracking-tight mb-2 uppercase">
              {activeTab === 'profiles' ? 'Full Profile Approval' : activeTab === 'verification' ? 'Identity Verification' : activeTab === 'moderation' ? 'Reviews Moderation' : 'Customer Support'}
            </h2>
            <p className="text-gray-500 text-sm lg:text-xl font-bold">ExpaLink Official Administration Panel.</p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'profiles' && (
            <div className="space-y-8">
              {pendingProfiles.length === 0 ? (
                <div className="apple-card p-14 text-center border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[40px]">
                   <Briefcase size={64} className="mx-auto text-gray-200 mb-8" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No listings pending review</p>
                </div>
              ) : (
                pendingProfiles.map(pro => (
                  <div key={pro.id} className="apple-card p-6 lg:p-10 bg-white border border-gray-100 flex flex-col gap-10 transition-all shadow-sm">
                    {/* Header with quick info & actions */}
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-6 border-b border-gray-50 pb-10">
                       <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-[32px] overflow-hidden border border-gray-100 shadow-sm bg-gray-50 shrink-0">
                            <img src={pro.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-bold text-gray-900">{pro.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">{pro.professions?.[0]}</span>
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase">{pro.yearsOfExperience} years exp.</span>
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">{pro.gender}</span>
                            </div>
                          </div>
                       </div>
                       <div className="flex gap-3 w-full lg:w-auto">
                          <button onClick={() => handleUpdateProfile(pro.id, 'approved')} className="flex-1 lg:flex-none px-8 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"><ThumbsUp size={20} /> Approve Profile</button>
                          <button onClick={() => setProfileRejectModal({ pro, reason: '' })} className="flex-1 lg:flex-none px-8 py-5 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"><ThumbsDown size={20} /> Reject</button>
                       </div>
                    </div>
                    
                    {/* Full Profile Audit */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                      <div className="xl:col-span-2 space-y-10">
                        {/* Identity & Origin */}
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User2 size={12}/> Identity & Origins</h4>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Nationalities</div>
                                <div className="flex flex-wrap gap-2">
                                  {pro.nationalities?.map(iso => <span key={iso} className="text-sm flex items-center gap-1 font-bold">{getFlagEmoji(iso)} {iso}</span>)}
                                </div>
                             </div>
                             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="text-[8px] font-bold text-gray-400 uppercase mb-1">Languages</div>
                                <div className="flex flex-wrap gap-2">
                                  {pro.languages?.map(lang => <span key={lang} className="text-sm flex items-center gap-1 font-bold">{LANGUAGE_FLAGS[lang] || '🌐'} {lang}</span>)}
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Professional Content */}
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={12}/> Biography & Description</h4>
                          <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 italic text-gray-700 leading-relaxed text-base shadow-inner">
                            "{pro.bio}"
                          </div>
                        </div>

                        {/* Specialties */}
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Award size={12}/> Services & Specialties</h4>
                          <div className="flex flex-wrap gap-2">
                            {pro.specialties.map(s => <span key={s} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 shadow-sm">{s}</span>)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-10">
                        {/* Contact & Professional Info */}
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={12}/> Contact Details</h4>
                          <div className="bg-gray-50 rounded-[32px] p-6 space-y-5 border border-gray-100">
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-800">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm"><Phone size={18} /></div>
                              <div><p className="text-[8px] uppercase text-gray-400 leading-none mb-1">Phone</p>{pro.phone || 'N/A'}</div>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-800">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm"><Mail size={18} /></div>
                              <div className="overflow-hidden"><p className="text-[8px] uppercase text-gray-400 leading-none mb-1">Email</p><span className="truncate block">{pro.email_pro || 'N/A'}</span></div>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-800">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm"><Globe size={18} /></div>
                              <div className="overflow-hidden"><p className="text-[8px] uppercase text-gray-400 leading-none mb-1">Website</p><span className="truncate block">{pro.websiteUrl || 'N/A'}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={12}/> {t('forms.cities')}</h4>
                          <div className="bg-gray-50 rounded-[32px] p-6 space-y-5 border border-gray-100">
                            <div className="flex items-start gap-4 text-sm font-bold text-gray-800">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0"><MapPin size={18} /></div>
                              <div><p className="text-[8px] uppercase text-gray-400 leading-none mb-1">Address</p>{pro.address || 'N/A'}</div>
                            </div>
                            <div>
                               <p className="text-[8px] font-bold uppercase text-gray-400 mb-2 ml-1">{t('forms.cities')}</p>
                               <div className="flex flex-wrap gap-2">
                                 {pro.cities?.map(c => <span key={c} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500">{c}</span>)}
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-8">
              {pendingDocs.length === 0 ? (
                <div className="apple-card p-14 text-center border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[40px]">
                   <ShieldAlert size={64} className="mx-auto text-gray-200 mb-8" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No identity verification requests</p>
                </div>
              ) : (
                pendingDocs.map(pro => (
                  <div key={pro.id} className="apple-card p-6 lg:p-10 border border-indigo-100 bg-white flex flex-col xl:flex-row items-start gap-8 lg:gap-12 transition-all shadow-sm">
                    <div className="flex items-center gap-6 lg:gap-8 shrink-0 w-full xl:w-auto">
                      <div className="w-20 h-20 rounded-[28px] overflow-hidden border border-gray-50 shadow-md bg-gray-50">
                        <img src={pro.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="min-w-[180px]">
                        <h3 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight mb-2">{pro.name}</h3>
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase">{pro.professions?.[0]}</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full bg-gray-50/50 rounded-[28px] p-6 lg:p-8 border border-gray-100">
                      <div className="flex items-center gap-3 mb-6"><FileSearch size={20} className="text-indigo-500" /><h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Provided Documents</h4></div>
                      {pro.documentUrl && Array.isArray(pro.documentUrl) && pro.documentUrl.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {pro.documentUrl.map((url, i) => (
                             <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group">
                               <div className="flex items-center gap-4 overflow-hidden"><div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FileText size={20} /></div><div className="text-xs lg:text-sm font-bold text-gray-900 truncate">Doc #{i+1}</div></div><ExternalLink size={16} className="text-gray-300" />
                             </a>
                           ))}
                        </div>
                      ) : <p className="text-center text-gray-400 font-bold py-4 italic">No documents uploaded</p>}
                    </div>
                    <div className="shrink-0 flex flex-row xl:flex-col gap-4 w-full xl:w-56">
                      <button onClick={() => handleUpdateDocs(pro.id, 'verified')} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-bold text-sm hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-3"><CheckCircle2 size={20} /> Verify ID</button>
                      <button onClick={() => handleUpdateDocs(pro.id, 'rejected')} className="flex-1 bg-white border-2 border-gray-100 text-gray-400 py-5 rounded-2xl font-bold text-sm hover:text-red-500 transition-all flex items-center justify-center gap-3"><XCircle size={20} /> Reject ID</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="apple-card border border-gray-100 bg-white overflow-hidden shadow-sm rounded-[32px] lg:rounded-[48px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-tight">Author</th><th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-tight">Expert</th><th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-tight">Review</th><th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-tight text-center">Score</th><th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-tight">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {reviews.length === 0 ? (<tr><td colSpan={5} className="p-16 text-center text-gray-300 font-bold uppercase text-sm">No reviews pending moderation</td></tr>) : reviews.map(review => (
                      <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 align-top"><div className="text-sm font-bold text-gray-900">{review.userName}</div><div className="text-xs font-medium text-gray-400">{review.isAnonymous ? 'Anonymous' : 'Public'}</div></td>
                        <td className="px-8 py-6 align-top"><div className="text-sm font-bold text-indigo-600">{review.proName}</div></td>
                        <td className="px-8 py-6 max-w-sm align-top">{editingReviewId === review.id ? (<div className="space-y-3"><textarea value={editingReviewText} onChange={e => setEditingReviewText(e.target.value)} className="w-full bg-indigo-50/30 border border-indigo-200 rounded-2xl p-4 text-sm font-medium h-32 outline-none" /><div className="flex gap-2"><button onClick={() => setEditingReviewId(null)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase">Cancel</button><button onClick={() => handleSaveReviewText(review.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-2"><Save size={12} /> Save</button></div></div>) : (<div className="flex gap-3 cursor-pointer" onClick={() => startEditingReview(review)}><MessageSquareQuote size={16} className="text-gray-300 shrink-0 mt-1" /><p className="text-sm text-gray-700 italic">"{review.testimonies}"</p></div>)}</td>
                        <td className="px-8 py-6 text-center align-top"><div className="flex items-center justify-center gap-1.5"><Star size={16} className="fill-amber-400 text-amber-400" /><span className="text-sm font-bold text-gray-900">{review.stars}</span></div></td>
                        <td className="px-8 py-6 align-top"><div className="flex gap-2"><button onClick={() => handleUpdateReview(review.id, 'verified')} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><ThumbsUp size={18} /></button><button onClick={() => handleUpdateReview(review.id, 'rejected')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><ThumbsDown size={18} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid grid-cols-1 gap-6 lg:gap-8">
              {supportMessages.length === 0 ? (
                <div className="apple-card p-14 text-center border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[40px]">
                   <LifeBuoy size={64} className="mx-auto text-gray-200 mb-8" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No support messages</p>
                </div>
              ) : supportMessages.map(msg => (
                <div key={msg.id} className="apple-card p-10 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-50"><div className="flex items-center gap-6"><div className="w-14 h-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-500 shadow-inner"><Mail size={24} /></div><div className="overflow-hidden"><h3 className="text-xl font-bold text-gray-900 truncate">{msg.subject}</h3><p className="text-sm font-bold text-indigo-600">{msg.email}</p></div></div><div className="bg-gray-50 px-4 py-2 rounded-full text-xs font-bold text-gray-400 uppercase">{new Date(msg.created_at).toLocaleDateString()}</div></div>
                   <p className="text-base text-gray-700 font-medium leading-relaxed pl-6 border-l-2 border-indigo-200 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {profileRejectModal && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setProfileRejectModal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={28} /></button>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 pr-10">Reject profile for {profileRejectModal.pro.name}</h3>
            <div className="space-y-6">
              <div><label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">Reason for rejection</label><textarea autoFocus value={profileRejectModal.reason} onChange={e => setProfileRejectModal({ ...profileRejectModal, reason: e.target.value })} placeholder="Ex: Incomplete address, invalid phone format, non-compliant photo..." className="w-full bg-gray-50 border border-gray-100 rounded-[28px] p-6 text-base font-medium h-40 resize-none outline-none focus:ring-2 focus:ring-red-100 focus:bg-white transition-all" /></div>
              <div className="flex gap-4 pt-4"><button onClick={() => setProfileRejectModal(null)} className="flex-1 py-5 bg-gray-50 text-gray-500 rounded-2xl font-bold text-base">Cancel</button><button onClick={() => handleUpdateProfile(profileRejectModal.pro.id, 'rejected', profileRejectModal.reason)} disabled={!profileRejectModal.reason.trim()} className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-bold text-base hover:bg-red-700 shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"><ThumbsDown size={22} /> Confirm Rejection</button></div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminPage;