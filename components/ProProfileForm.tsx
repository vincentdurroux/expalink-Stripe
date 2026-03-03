import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, User, X, ChevronDown, Loader2, CheckCircle, Mail, Info, Camera, Plus, Sparkles, Globe, Search, Trash2, Award, Fingerprint, Languages, ShieldAlert, ShieldCheck, PenLine, Briefcase, GraduationCap, Check, ArrowRight, Save, MessageCircle, AlertCircle, ExternalLink, Phone, Calendar } from 'lucide-react';
import { PROFESSION_CATEGORIES, LANGUAGES, SPECIALTIES_MAP, SPANISH_CITIES, ISO_COUNTRIES, getFlagEmoji, LANGUAGE_FLAGS } from '../constants';
import { Gender } from '../types';
import { useTranslation } from 'react-i18next';
import { compressAndUploadImage } from '../services/userService';
import { translateProfile } from '../services/geminiService';
import { supabase } from '../supabaseClient';

interface ProProfileFormProps {
  onComplete: (profileData: any) => void;
  initialData?: any; 
  onCancel?: () => void;
}

const ProProfileForm: React.FC<ProProfileFormProps> = ({ onComplete, initialData, onCancel }) => {
  const { t, i18n } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');

  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.full_name || '', 
    companyName: initialData?.companyName || initialData?.company_name || '', 
    gender: (initialData?.gender as Gender) || 'prefer-not-to-say', 
    nationalities: (initialData?.nationalities || initialData?.nationality || []) as string[], 
    dialCode: initialData?.dialCode || '+34', 
    phone: initialData?.phone || '', 
    whatsapp_number: initialData?.whatsapp_number || '',
    email_pro: initialData?.email_pro || '', 
    websiteUrl: initialData?.websiteUrl || initialData?.website_url || '', 
    bookingUrl: initialData?.bookingUrl || initialData?.booking_url || '',
    address: initialData?.address || '', 
    latitude: initialData?.latitude || initialData?.location_lat || null,
    longitude: initialData?.longitude || initialData?.location_lng || null,
    profession: initialData?.profession || initialData?.professions?.[0] || '', 
    yearsOfExperience: initialData?.yearsOfExperience ?? initialData?.years_experience ?? 5, 
    bio: initialData?.bio || '', 
    specialties: (initialData?.specialties || []) as string[], 
    cities: (initialData?.cities || initialData?.all_cities || []) as string[], 
    languages: (initialData?.languages || []) as string[]
  });

  const [activeMenu, setActiveMenu] = useState<'nat' | 'lang' | 'city' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');

  // WhatsApp logic - Preserves '+'
  const cleanedWhatsApp = useMemo(() => formData.whatsapp_number.replace(/[^\d+]/g, ''), [formData.whatsapp_number]);
  const isWhatsAppValid = useMemo(() => {
    const digitsOnly = cleanedWhatsApp.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }, [cleanedWhatsApp]);
  
  const handleWhatsAppTest = () => {
    if (isWhatsAppValid) {
      // API WhatsApp standard avoids '+' in URL
      const urlDigits = cleanedWhatsApp.replace(/\D/g, '');
      window.open(`https://wa.me/${urlDigits}`, '_blank');
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('keydown', handleClickOutside);
  }, []);

  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google;
      if (addressInputRef.current && google?.maps?.places) {
        if (autocompleteRef.current && google.maps.event) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        const options = { types: ['geocode', 'establishment'], fields: ['formatted_address', 'geometry', 'name'], componentRestrictions: { country: 'es' } };
        try {
          autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, options);
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.geometry?.location) {
              setFormData(prev => ({ 
                ...prev, 
                address: place.formatted_address || place.name || '',
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              }));
            }
          });
        } catch (e) { console.warn("Autocomplete error", e); }
      }
    };
    if ((window as any).google?.maps?.places) initAutocomplete();
    window.addEventListener('google-maps-loaded', initAutocomplete);
    return () => { window.removeEventListener('google-maps-loaded', initAutocomplete); };
  }, []); // Static init

  const completionPercentage = useMemo(() => {
    let score = 0;
    if (formData.name?.trim()) score += 10;
    if (imagePreview) score += 10;
    if (formData.profession) score += 15;
    if (formData.bio?.length >= 20) score += 15;
    if (formData.cities?.length > 0) score += 10;
    if (formData.languages?.length > 0) score += 10;
    if (formData.nationalities?.length > 0) score += 10;
    if (formData.phone?.trim() || (formData.whatsapp_number && isWhatsAppValid)) score += 10;
    if (formData.address?.trim()) score += 10;
    return Math.min(100, score);
  }, [formData, imagePreview, isWhatsAppValid]);

  const isFormValid = useMemo(() => {
    const hasPhone = formData.phone?.trim().length > 0;
    const hasWhatsApp = formData.whatsapp_number !== '' && isWhatsAppValid;

    return (
      formData.name?.trim().length > 0 &&
      formData.bio?.trim().length >= 20 &&
      (hasPhone || hasWhatsApp) && // Au moins l'un des deux doit être présent
      formData.profession?.trim().length > 0 &&
      formData.nationalities?.length > 0 &&
      formData.languages?.length > 0 &&
      formData.specialties?.length > 0 &&
      formData.cities?.length > 0 &&
      (formData.whatsapp_number === '' || isWhatsAppValid)
    );
  }, [formData, isWhatsAppValid]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddCustomSpecialty = () => {
    const trimmed = customSpecialty.trim();
    if (!trimmed) return;
    if (!formData.specialties.includes(trimmed)) {
      setFormData(prev => ({ ...prev, specialties: [...prev.specialties, trimmed] }));
    }
    setCustomSpecialty('');
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (completionPercentage < 80 || !isFormValid) return;
    setShowFinalModal(true);
  };

  const handleFinalConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try { 
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      let bios = {};
      let specialtyTranslations = {};
      try {
        const translations = await translateProfile(formData.bio, formData.specialties);
        bios = translations.bios;
        specialtyTranslations = translations.specialtyTranslations;
      } catch (err) {
        console.warn("AI Translation failed, using fallback logic", err);
      }

      let finalImageUrl = imagePreview;
      if (selectedImageFile) {
        finalImageUrl = await compressAndUploadImage(selectedImageFile, 'avatars', user.id, 'pro_photo');
      } else if (imagePreview === '') {
        // If imagePreview was cleared, we reset to empty in DB
        finalImageUrl = '';
      }

      // LOGIQUE : Si WhatsApp est présent et valide, il devient le numéro de téléphone principal
      const finalPhoneNumber = (cleanedWhatsApp && isWhatsAppValid) ? cleanedWhatsApp : formData.phone;

      const submissionData = {
        id: user.id,
        full_name: formData.name,
        company_name: formData.companyName,
        gender: formData.gender,
        nationality: formData.nationalities, 
        phone: finalPhoneNumber,
        whatsapp_number: cleanedWhatsApp,
        email_pro: formData.email_pro,
        website_url: formData.websiteUrl,
        booking_url: formData.bookingUrl,
        address: formData.address,
        location_lat: formData.latitude,
        location_lng: formData.longitude,
        professions: formData.profession ? [formData.profession] : [],
        years_experience: formData.yearsOfExperience,
        bio: formData.bio,
        bios: bios, 
        specialty_translations: specialtyTranslations, 
        specialties: formData.specialties,
        all_cities: formData.cities, 
        languages: formData.languages,
        pro_image_url: finalImageUrl,
        is_pro_complete: true,
        bio_verification_status: 'pending',
        is_profile_online: false
      };

      await onComplete(submissionData); 
      setShowFinalModal(false);
    } catch (err: any) {
      console.error("Submission failed", err);
    } finally { 
      setIsProcessing(false); 
    }
  };

  const toggleItem = (list: string[], item: string, key: string) => {
    const trimmedItem = item.trim();
    if (!trimmedItem) return;
    const newList = list.includes(trimmedItem) ? list.filter(i => i !== trimmedItem) : [...list, trimmedItem];
    setFormData({ ...formData, [key]: newList });
  };

  const availableSpecialties = useMemo(() => formData.profession ? (SPECIALTIES_MAP[formData.profession] || []) : [], [formData.profession]);
  const manualSpecialties = useMemo(() => formData.specialties.filter(s => !availableSpecialties.includes(s)), [formData.specialties, availableSpecialties]);

  const renderDropdown = (label: string, items: string[], selectedItems: string[], key: string, type: 'nat' | 'lang' | 'city', icon: React.ReactNode, placeholder: string, getItemDisplay: (item: string) => React.ReactNode) => {
    const isOpen = activeMenu === type;
    const filtered = items.filter(item => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return item.toLowerCase().includes(q) || t(`${type === 'nat' ? 'nationalities' : type === 'lang' ? 'languages' : 'cities'}.${item}`).toLowerCase().includes(q);
    });
    return (
      <div className="space-y-2 relative" onClick={(e) => e.stopPropagation()}>
        <label className="text-[10px] font-bold uppercase text-gray-900 ml-1 flex items-center gap-2">{icon} {label} *</label>
        <button type="button" onClick={() => { setActiveMenu(isOpen ? null : type); setSearchQuery(''); }} className={`w-full bg-gray-50 border border-transparent hover:border-indigo-200 rounded-2xl px-5 py-4 text-sm font-bold flex items-center justify-between transition-all ${isOpen ? 'ring-2 ring-indigo-100 border-indigo-400 bg-white' : ''}`}><div className="flex flex-wrap gap-2 truncate">{selectedItems.length > 0 ? selectedItems.map(si => (<span key={si} className="bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-sm">{getItemDisplay(si)}<X size={10} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleItem(selectedItems, si, key); }} /></span>)) : (<span className="text-gray-400">{placeholder}</span>)}</div><ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
        {isOpen && (<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[24px] shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2"><div className="p-3 border-b border-gray-50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input autoFocus type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('common.search')} className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none focus:bg-white border border-transparent focus:border-indigo-200" /></div></div><div className="max-h-60 overflow-y-auto no-scrollbar py-1">{filtered.map(item => (<button key={item} type="button" onClick={() => toggleItem(selectedItems, item, key)} className={`w-full px-5 py-3 text-left text-xs font-bold flex items-center justify-between hover:bg-gray-50 ${selectedItems.includes(item) ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-600'}`}><span className="flex items-center gap-3">{getItemDisplay(item)}</span>{selectedItems.includes(item) && <Check size={14} />}</button>))}{filtered.length === 0 && (<div className="px-5 py-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('common.noResults')}</div>)}</div></div>)}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-44 md:pt-48 pb-40 animate-in fade-in">
      <div className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] px-6">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-xl rounded-full p-1.5 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-3"><div className="h-full bg-gradient-to-r from-[#45a081] to-[#2e75c2] transition-all duration-1000 ease-out" style={{ width: `${completionPercentage}%` }} /></div>
          <div className="bg-gray-900 text-white rounded-full px-3 py-1 text-[10px] font-bold">{completionPercentage}%</div>
        </div>
      </div>
      <div className="mb-12 text-center"><h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">{t('forms.subtitle').split(' ').slice(0, -1).join(' ')}{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2]">{t('forms.subtitle').split(' ').pop()}</span></h1><p className="text-gray-400 text-sm md:text-base font-medium max-w-lg mx-auto">{t('forms.visibilityHint')}</p></div>
      <form onSubmit={handleSubmitAttempt} className="space-y-12">
        <div className="apple-card p-8 border border-gray-100 bg-white space-y-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-6"><div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><User size={20} /></div><h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{t('forms.identity')}</h2></div>
          <div className="flex flex-col md:flex-row gap-10">
            <div className="relative group shrink-0 mx-auto md:mx-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-300 transition-all shadow-inner relative" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <User className="text-gray-300" size={48} />
                    <Camera className="text-gray-200" size={20} />
                  </div>
                )}
              </div>
              {imagePreview && (
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setImagePreview(''); setSelectedImageFile(null); }} 
                  className="absolute top-2 right-2 bg-white text-red-500 p-3 rounded-full shadow-2xl border border-red-50 hover:bg-red-500 hover:text-white transition-all z-10 active:scale-90" 
                  title={t('common.close')}
                >
                  <Trash2 size={18} />
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>
            <div className="flex-1 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.fullName')} *</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all focus:bg-white" placeholder={t('forms.fullNamePlaceholder')} /></div><div className="space-y-2"><label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.genderLabel')}</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-2xl px-5 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:bg-white"><option value="male">{t('common.male')}</option><option value="female">{t('common.female')}</option><option value="other">{t('common.other')}</option><option value="prefer-not-to-say">{t('common.prefer-not-to-say')}</option></select></div></div><div className="space-y-2"><label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.company')}</label><input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-2xl px-5 py-4 text-sm font-bold outline-none transition-all focus:bg-white" placeholder={t('forms.companyPlaceholder')} /></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">{renderDropdown(t('forms.nationality'), ISO_COUNTRIES, formData.nationalities, 'nationalities', 'nat', <Globe size={14} className="text-blue-500" />, t('forms.searchNationality'), (iso) => <><span className="text-base">{getFlagEmoji(iso)}</span> {t(`nationalities.${iso}`)}</>)}{renderDropdown(t('forms.languages'), LANGUAGES, formData.languages, 'languages', 'lang', <Languages size={14} className="text-emerald-500" />, t('forms.languages'), (lang) => <><span className="text-base">{LANGUAGE_FLAGS[lang]}</span> {t(`languages.${lang}`)}</>)}</div>
        </div>
        <div className="apple-card p-8 border border-gray-100 bg-white space-y-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-6"><div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"><Award size={20} /></div><h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{t('forms.expertise')}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-2"><label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.mainProfession')} *</label><div className="relative"><Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} /><select required value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value, specialties: []})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-2xl pl-12 pr-10 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:bg-white"><option value="">{t('forms.profSelectPlaceholder')}</option>{Object.entries(PROFESSION_CATEGORIES).map(([cat, pros]) => (<optgroup key={cat} label={t(`search.categories.${cat}`)}>{pros.map(p => <option key={p} value={p}>{t(`professions.${p}`)}</option>)}</optgroup>))}</select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} /></div></div><div className="space-y-2"><div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.yearsOfExperience')}</label><span className="text-xs font-bold text-indigo-600">{formData.yearsOfExperience} {t('common.yearsExp')}</span></div><input type="range" min="0" max="40" step="1" value={formData.yearsOfExperience} onChange={e => setFormData({...formData, yearsOfExperience: parseInt(e.target.value)})} className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" /></div></div>
          {formData.profession && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.services')} *</label>
              <div className="flex flex-wrap gap-2">{availableSpecialties.map(spec => (<button key={spec} type="button" onClick={() => toggleItem(formData.specialties, spec, 'specialties')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.specialties.includes(spec) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-emerald-200'}`}>{t(`specialties.${spec}`) !== `specialties.${spec}` ? t(`specialties.${spec}`) : spec}</button>))}{manualSpecialties.map(spec => (<button key={spec} type="button" onClick={() => toggleItem(formData.specialties, spec, 'specialties')} className="px-4 py-2.5 bg-emerald-600 text-white border border-emerald-600 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 group">{spec}<X size={12} className="opacity-50 group-hover:opacity-100" /></button>))}</div>
              <div className="flex gap-2"><input type="text" placeholder={t('forms.specialtiesPlaceholder')} value={customSpecialty} onChange={e => setCustomSpecialty(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSpecialty(); } }} className="flex-1 bg-gray-50 border border-transparent focus:border-emerald-400 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:bg-white" /><button type="button" onClick={handleAddCustomSpecialty} className="bg-emerald-50 text-emerald-600 px-4 rounded-xl font-bold hover:bg-emerald-100 transition-all"><Plus size={20} /></button></div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.profDescription')} *</label>
              <span className={`text-xs px-3 py-1 rounded-full ${formData.bio.length >= 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}>
                {formData.bio.length} / {t('forms.minBioLength')}
              </span>
            </div>
            <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-3xl p-6 text-sm font-medium h-40 resize-none outline-none transition-all focus:bg-white shadow-inner" placeholder={t('forms.bioPlaceholder')} />
            <div className="flex items-start gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 mt-2"><Info size={20} className="text-blue-500 shrink-0 mt-0.5" /><p className="text-[11px] md:text-xs font-bold text-blue-900/80 italic leading-relaxed">{t('forms.bioSecurityNote')}</p></div>
          </div>
        </div>

        <div className="apple-card p-8 border border-gray-100 bg-white space-y-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-6"><div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm"><MapPin size={20} /></div><h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{t('forms.contactZones')}</h2></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.phoneMain')} {!(formData.whatsapp_number && isWhatsAppValid) && '*'}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white" placeholder="+34 612 345 678" />
              </div>
            </div>

            {/* WHATSAPP SYSTEM */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase text-gray-900 flex items-center gap-2">
                  <MessageCircle size={16} className="text-emerald-500" /> WhatsApp
                </label>
                {formData.whatsapp_number && (
                  <div className="flex items-center gap-1.5 transition-all animate-in fade-in">
                    {isWhatsAppValid ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.whatsapp_number} 
                  onChange={e => setFormData({...formData, whatsapp_number: e.target.value.replace(/[^\d\s+\-()]/g, '')})} 
                  className={`w-full bg-gray-50 border transition-all rounded-xl pl-5 pr-5 py-3.5 text-sm font-bold outline-none focus:bg-white ${formData.whatsapp_number ? (isWhatsAppValid ? 'border-emerald-200 focus:border-emerald-400' : 'border-red-200 focus:border-red-400') : 'border-transparent focus:border-indigo-400'}`} 
                  placeholder="+34 612 345 678" 
                />
              </div>

              {formData.whatsapp_number && (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-3 bg-gray-50 rounded-2xl animate-in slide-in-from-top-1">
                  <button 
                    type="button" 
                    onClick={handleWhatsAppTest}
                    disabled={!isWhatsAppValid}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 ${isWhatsAppValid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    <ExternalLink size={12} /> {t('forms.whatsappTest')}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.emailPro')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="email" value={formData.email_pro} onChange={e => setFormData({...formData, email_pro: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white" placeholder="contact@pro.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.website')}</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="url" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white" placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2 col-span-1 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase text-indigo-600 ml-1 flex items-center gap-2">
                <Calendar size={12} /> {t('forms.bookingLabel')}
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input type="url" value={formData.bookingUrl} onChange={e => setFormData({...formData, bookingUrl: e.target.value})} className="w-full bg-indigo-50/20 border border-indigo-100/50 focus:border-indigo-400 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:bg-white" placeholder={t('forms.bookingPlaceholder')} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-900 ml-1">{t('forms.address')}</label>
              <div className="relative">
                <input ref={addressInputRef} type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:border-indigo-400 rounded-2xl px-5 py-4 pl-12 text-sm font-bold outline-none transition-all focus:bg-white" placeholder={t('forms.addressPlaceholder')} autoComplete="off" /><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              </div>
            </div>
            {renderDropdown(t('forms.cities'), SPANISH_CITIES, formData.cities, 'cities', 'city', <MapPin size={14} className="text-orange-500" />, t('forms.searchCity'), (city) => <span>{t(`cities.${city}`)}</span>)}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-black text-left uppercase tracking-widest ml-1">{t('common.mandatoryFields')}</p>
            <button type="submit" disabled={isProcessing || completionPercentage < 80 || !isFormValid} className={`w-full py-6 rounded-[24px] font-bold text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 ${completionPercentage < 80 || !isFormValid ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-gray-800'}`}>{isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24} /> {t('forms.finalize')}</>}</button>
          </div>
          {onCancel && <button type="button" onClick={onCancel} className="w-full py-5 text-gray-400 font-bold text-lg hover:text-gray-900 transition-all">{t('common.back')}</button>}
        </div>
      </form>
      {showFinalModal && (<div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"><div className="absolute inset-0" onClick={() => !isProcessing && setShowFinalModal(false)} /><div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"><div className="pt-12 pb-4 flex flex-col items-center justify-center relative"><div className="w-20 h-20 rounded-[32px] bg-emerald-50/80 flex items-center justify-center shadow-inner z-10"><Save size={40} className="text-[#45a081]" /></div></div><div className="p-8 md:p-12 pt-4 flex flex-col items-center text-center"><h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{t('forms.finalize')}</h3><div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 mb-10 w-full"><p className="text-gray-600 text-sm md:text-base font-bold leading-relaxed">{t('forms.finalizeDisclaimer')}</p></div><div className="flex flex-col gap-5 w-full"><button onClick={handleFinalConfirm} disabled={isProcessing} className={`w-full py-6 rounded-2xl font-bold text-base md:text-lg shadow-xl transition-all flex flex-col items-center justify-center gap-3 active:scale-95 ${isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#45a081] text-white hover:opacity-90'}`}>{isProcessing ? (<><Loader2 className="animate-spin" size={32} /><span className="text-xs md:sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2] px-4 animate-pulse">{t('forms.savingInfo')}</span></>) : (<span className="flex items-center gap-3">{t('common.confirm')} <ArrowRight size={22} /></span>)}</button>{!isProcessing && (<button onClick={() => setShowFinalModal(false)} className="w-full py-4 text-gray-400 font-bold text-sm hover:text-gray-900 transition-all">{t('common.close')}</button>)}</div>{!isProcessing && (<div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase text-gray-300 tracking-widest"><ShieldCheck size={14} className="text-emerald-400" />{t('auth.secureBy')}</div>)}</div></div></div>)}
    </div>
  );
};

export default ProProfileForm;