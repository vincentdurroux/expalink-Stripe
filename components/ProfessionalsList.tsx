import React, { useEffect, useState } from 'react';
import { Briefcase, ArrowLeft, Loader2, User as UserIcon, Search, ShieldCheck, Globe, Star } from 'lucide-react';
import { getActiveProfessionalProfiles } from '../services/userService';
import { useTranslation } from 'react-i18next';
import { Professional } from '../types';

interface ProfessionalsListProps { onBack: () => void; }

const ProfessionalsList: React.FC<ProfessionalsListProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { getActiveProfessionalProfiles().then(setPros).finally(() => setLoading(false)); }, []);

  const filteredPros = pros.filter(pro => pro.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between gap-6 mb-12">
        <div><button onClick={onBack} className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase mb-4"><ArrowLeft size={16} /> {t('common.back')}</button><h1 className="text-4xl font-black flex items-center gap-3"><Briefcase size={32} className="text-emerald-600" /> {t('nav.professionals')}</h1></div>
        <div className="relative group min-w-[300px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder={t('search.placeholderProf')} className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
      </div>
      {loading ? <div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-emerald-500" size={40} /><p className="text-xs font-bold text-gray-400 uppercase">{t('admin.loading')}</p></div> : filteredPros.length > 0 ? <div className="grid grid-cols-1 gap-6">{filteredPros.map((pro, index) => (
        <div key={pro.id || index} className="apple-card p-8 border border-gray-100 bg-white flex flex-col sm:flex-row items-center gap-8 hover:border-emerald-100 transition-all group">
          <div className="relative w-20 h-20 rounded-3xl overflow-hidden shadow-md ring-4 ring-white"><img src={pro.image || 'https://i.pravatar.cc/300'} className="w-full h-full object-cover" /><div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center"><ShieldCheck size={12} className="text-white" /></div></div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
              <h3 className="text-xl font-black group-hover:text-emerald-600 transition-colors">{pro.name || t('common.expert')}</h3>
              {Number(pro.reviews) > 0 && (
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold">{(pro.rating || 5.0).toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest"><div className="flex items-center gap-1"><Globe size={12} className="text-emerald-400" /><span>{t('dashboard.visibility.online')}</span></div></div>
          </div>
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 transition-all shadow-lg">{t('common.viewProfile')}</button>
        </div>
      ))}</div> : <div className="text-center py-20 bg-gray-50 border border-dashed rounded-[40px]"><Briefcase size={48} className="mx-auto text-gray-300 mb-4" /><h3 className="text-lg font-bold">{t('landing.results.noneTitle')}</h3></div>}
    </div>
  );
};

export default ProfessionalsList;