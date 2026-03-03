
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Languages, Briefcase, ChevronDown, Navigation, X, Info, LocateFixed, Loader2 } from 'lucide-react';
import { SearchFilters } from '../types';
import { PROFESSION_CATEGORIES, LANGUAGES, LANGUAGE_FLAGS, SPANISH_CITY_DATA } from '../constants';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  onSearch: (filters: SearchFilters & { lat?: number; lng?: number; locationName?: string }) => void;
  onFocusChange?: (focused: boolean) => void;
  isSearching?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFocusChange, isSearching = false }) => {
  const { t, i18n } = useTranslation();
  const [isFocused, setIsFocusedState] = useState(false);
  const [profession, setProfession] = useState('');
  const [language, setLanguage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  const [locationInput, setLocationInput] = useState(t('search.nearMe'));
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  const setIsFocused = (focused: boolean) => {
    setIsFocusedState(focused);
    if (onFocusChange) onFocusChange(focused);
  };

  useEffect(() => {
    const nearMeLabels = ["Near me", "Autour de moi", "Cerca de mí"];
    if (nearMeLabels.includes(locationInput)) {
      setLocationInput(t('search.nearMe'));
    }
  }, [i18n.language, t]);

  useEffect(() => {
    handleGeolocate(true);
  }, []);

  useEffect(() => {
    const initAutocomplete = () => {
      const google = (window as any).google;
      if (addressInputRef.current && google?.maps?.places) {
        if (autocompleteRef.current && google.maps.event) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }

        const options = {
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['geocode'],
          componentRestrictions: { country: 'es' }
        };

        try {
          autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, options);
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.geometry?.location) {
              setSelectedCoords({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              });
              setLocationInput(place.formatted_address || place.name || '');
            }
          });
        } catch (e) {
          console.warn("Autocomplete init error", e);
        }
      }
    };

    if ((window as any).google?.maps?.places) {
      initAutocomplete();
    }
    
    window.addEventListener('google-maps-loaded', initAutocomplete);
    
    return () => {
      window.removeEventListener('google-maps-loaded', initAutocomplete);
      if (autocompleteRef.current && (window as any).google?.maps?.event) {
        try {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {}
      }
    };
  }, []); // Static init

  const handleGeolocate = (silent: boolean = false): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      if (!silent) setIsLocating(true);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setSelectedCoords({ lat: coords.latitude, lng: coords.longitude });
          setLocationInput(t('search.nearMe'));
          if (!silent) setIsLocating(false);
          resolve({ lat: coords.latitude, lng: coords.longitude });
        },
        (err) => {
          console.warn("Geolocation permission denied or error", err);
          if (!silent) setIsLocating(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profession.trim() || isSearching) return;
    
    let searchLat = selectedCoords?.lat;
    let searchLng = selectedCoords?.lng;
    const isNearMe = locationInput === t('search.nearMe');

    if (!isNearMe && !searchLat && locationInput) {
      const normalizedInput = locationInput.trim().toLowerCase();
      // Find city match case-insensitively
      const cityKey = Object.keys(SPANISH_CITY_DATA).find(
        key => key.toLowerCase() === normalizedInput
      );
      
      if (cityKey) {
        const cityMatch = SPANISH_CITY_DATA[cityKey];
        searchLat = cityMatch.lat;
        searchLng = cityMatch.lng;
      }
    }

    if (isNearMe && !searchLat) {
      const coords = await handleGeolocate(false);
      if (coords) {
        searchLat = coords.lat;
        searchLng = coords.lng;
      }
    }

    onSearch({
      profession,
      language,
      city: isNearMe ? '' : locationInput,
      lat: searchLat,
      lng: searchLng,
      locationName: locationInput
    });
    setIsFocused(false);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 md:px-6 relative transition-all duration-500 ${isFocused ? 'z-[4001]' : 'z-10'}`}>
      <form onSubmit={handleSearch} className={`bg-white p-2 rounded-[32px] lg:rounded-[40px] transition-all duration-500 flex flex-col lg:flex-row items-stretch lg:items-center border border-[#45a081] ${isFocused ? 'shadow-[0_40px_80px_rgba(0,0,0,0.3)] scale-[1.02]' : 'shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
        
        {/* PROFESSION SELECT */}
        <div className="flex-[1.2] min-w-0 flex items-center justify-center lg:justify-start px-4 lg:px-5 py-4 border-b lg:border-b-0 lg:border-r border-gray-100 relative min-h-[56px]">
          <Briefcase className="hidden lg:block mr-3 shrink-0 text-gray-300" size={20} />
          <div className="relative flex-1 min-w-0">
            <select 
              className="w-full bg-transparent outline-none text-lg lg:text-base font-bold text-gray-800 appearance-none cursor-pointer text-center lg:text-left pr-6 truncate" 
              style={{ textAlignLast: 'center', textAlign: 'center' }} 
              value={profession} 
              onFocus={() => setIsFocused(true)} 
              onChange={(e) => setProfession(e.target.value)}
            >
              <option value="">{t('search.placeholderProf')}</option>
              {Object.entries(PROFESSION_CATEGORIES).map(([catKey, profs]) => (
                <optgroup key={catKey} label={t(`search.categories.${catKey}`)}>
                  {profs.map(p => (<option key={p} value={p}>{t(`professions.${p}`)}</option>))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none lg:right-2" size={16} />
          </div>
        </div>

        {/* LOCATION INPUT */}
        <div className="flex-[1.5] min-w-[280px] flex items-center justify-center lg:justify-start px-4 lg:px-5 py-4 border-b lg:border-b-0 lg:border-r border-gray-100 relative min-h-[56px]">
          <MapPin className="hidden lg:block mr-3 shrink-0 text-gray-300" size={20} />
          <div className="relative flex-1 min-w-0 flex items-center justify-center lg:justify-start gap-2">
            <input 
              ref={addressInputRef} 
              type="text" 
              value={locationInput} 
              onFocus={() => setIsFocused(true)} 
              onChange={(e) => { setLocationInput(e.target.value); if (selectedCoords) setSelectedCoords(null); }} 
              className="w-full bg-transparent outline-none text-lg lg:text-base font-bold text-gray-800 placeholder:text-gray-400 text-center lg:text-left" 
              placeholder={t('search.placeholderCity')} 
              autoComplete="off" 
            />
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => handleGeolocate(false)} className={`p-2 rounded-xl transition-all ${selectedCoords && locationInput === t('search.nearMe') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-300 hover:text-indigo-500 hover:bg-gray-50'}`} title={t('search.nearMe')}>
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
              </button>
              {locationInput && (
                <button type="button" onClick={() => { setLocationInput(''); setSelectedCoords(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-300 hover:text-gray-900">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LANGUAGE SELECT */}
        <div className="flex-1 min-w-0 flex items-center justify-center lg:justify-start px-4 lg:px-5 py-4 relative group lg:border-r lg:border-gray-100 min-h-[56px]">
          <Languages className="hidden lg:block mr-3 shrink-0 text-gray-300" size={20} />
          <div className="relative flex-1 min-w-0">
            <select 
              className="w-full bg-transparent outline-none text-lg lg:text-base font-bold text-gray-800 appearance-none cursor-pointer text-center lg:text-left pr-6 truncate" 
              style={{ textAlignLast: 'center', textAlign: 'center' }} 
              value={language} 
              onFocus={() => setIsFocused(true)} 
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="">{t('search.placeholderLang')}</option>
              {LANGUAGES.map((l: string) => <option key={l} value={l}>{LANGUAGE_FLAGS[l] || '🌐'} {t(`languages.${l}`)}</option>)}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none lg:right-2" size={16} />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="p-1.5 lg:p-0">
          <button type="submit" disabled={!profession.trim() || isSearching} className={`w-full lg:w-auto px-8 py-5 lg:py-4 rounded-2xl lg:rounded-[32px] font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg lg:ml-2 min-h-[56px] ${!profession.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-[#45a081] to-[#2e75c2] text-white hover:brightness-110'} ${isSearching ? 'animate-pulse' : ''}`}>
            <Search size={20} className={isSearching ? 'animate-spin' : ''} />
            <span className="whitespace-nowrap text-xl lg:text-base tracking-widest font-bold uppercase">{isSearching ? t('auth.processing') : t('search.btn')}</span>
          </button>
        </div>
      </form>
      
      <style>{`
        @media (max-width: 1023px) {
          select, input {
            text-align: center !important;
            text-align-last: center !important;
          }
          select::-ms-expand { display: none; }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;
