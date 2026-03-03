import React, { useState, useEffect } from 'react';
import { Review, ReviewStatus, Professional, VerificationStatus } from '../types';
// Fixed: Using correct exported function names from userService
import { getAllReviewsForAdmin, updateReviewStatus, getPendingVerificationProfiles, updateExpertVerificationStatus } from '../services/userService';
import { ShieldCheck, Star, CheckCircle, Clock, XCircle, Loader2, MessageSquare, User, Briefcase, FileText, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'reviews' | 'profiles'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fixed: Using correct exported function names from userService
      const [reviewsData, profilesData] = await Promise.all([
        getAllReviewsForAdmin(),
        getPendingVerificationProfiles()
      ]);
      setReviews(reviewsData);
      setProfiles(profilesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    setProcessingId(reviewId);
    try {
      await updateReviewStatus(reviewId, status);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: status } : r));
    } catch (err) {
      alert(t('admin.errorStatus'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateExpertStatus = async (userId: string, status: VerificationStatus) => {
    setProcessingId(userId);
    try {
      await updateExpertVerificationStatus(userId, status);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, verificationStatus: status, verified: status === 'verified' } : p));
    } catch (err) {
      alert(t('admin.errorValidation'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={40} />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1d1d1f] mb-2 flex items-center gap-3">
          <ShieldCheck className="text-indigo-600" size={36} />
          {t('admin.title')}
        </h1>
        <p className="text-gray-500 text-lg">{t('admin.subtitle')}</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {t('admin.tabs.reviews')}
        </button>
        <button 
          onClick={() => setActiveTab('profiles')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'profiles' ? 'bg-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-100'}`}
        >
          {t('admin.tabs.profiles')}
        </button>
      </div>

      <div className="apple-card border border-gray-100 overflow-hidden bg-white shadow-xl">
        {activeTab === 'reviews' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.reviews.colExpat')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.reviews.colPro')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.reviews.colRating')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.reviews.colComment')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.reviews.colStatus')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><User size={14} /></div>
                        <span className="font-bold text-gray-900 text-sm">{review.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Briefcase size={14} /></div>
                        <span className="font-bold text-gray-900 text-sm">{review.proName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-bold">{review.stars}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-gray-500 line-clamp-2 max-w-xs">{review.testimonies}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        review.status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        review.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {review.status === 'verified' ? <CheckCircle size={10} /> : review.status === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                        {t(`admin.reviews.${review.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {review.status !== 'verified' && (
                          <button 
                            onClick={() => handleUpdateReviewStatus(review.id, 'verified')}
                            disabled={processingId === review.id}
                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            title={t('admin.reviews.publishBtn')}
                          >
                            <ThumbsUp size={16} />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateReviewStatus(review.id, 'rejected')}
                            disabled={processingId === review.id}
                            className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            title={t('admin.reviews.rejectBtn')}
                          >
                            <ThumbsDown size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reviews.length === 0 && (
              <div className="p-20 text-center">
                <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.reviews.empty')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.experts.colName')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.experts.colCompany')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.experts.colStatus')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img src={p.image || 'https://i.pravatar.cc/100'} className="w-10 h-10 rounded-xl object-cover" alt="" />
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-xs text-gray-600 font-medium">{p.companyName || t('admin.experts.none')}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                        p.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        p.verificationStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' : 
                        p.verificationStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {p.verificationStatus === 'verified' ? <CheckCircle size={10} /> : p.verificationStatus === 'rejected' ? <XCircle size={10} /> : <Clock size={10} />}
                        {t(`admin.experts.${p.verificationStatus || 'none'}`)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {p.verificationStatus !== 'verified' && (
                          <button 
                            onClick={() => handleUpdateExpertStatus(p.id, 'verified')}
                            disabled={processingId === p.id}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            title={t('admin.experts.verifyBtn')}
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        {p.verificationStatus !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateExpertStatus(p.id, 'rejected')}
                            disabled={processingId === p.id}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            title={t('admin.experts.unverifyBtn')}
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {profiles.length === 0 && (
              <div className="p-20 text-center">
                <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest">{t('admin.experts.empty')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;