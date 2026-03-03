import { Professional, Review, UnlockToken, UserType, VerificationStatus, ReviewStatus } from '../types';
import { supabase } from '../supabaseClient';

export const PRO_MINIMAL_COLUMNS = 'id, full_name, gender, nationality, years_experience, professions, specialties, all_cities, languages, rating, reviews_count, pro_image_url, is_featured, is_pro_complete, bio_verification_status, verification_status, avatar_url, location_lat, location_lng, bio, bios, specialty_translations, pro_plan, email_pro, booking_url, subscription_ends_at, plan_status, cancel_at_period_end';
export const PRO_PRIVATE_COLUMNS = 'phone, whatsapp_number, website_url, address, verification_documents';

/**
 * Utilitaire interne pour compresser une image avant l'envoi.
 */
const compressImage = async (file: File): Promise<Blob | File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 1600;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          0.8
        );
      };
    };
  });
};

export const updateUserProfile = async (uid: string, updates: any) => {
  if (!uid) throw new Error("User ID is required for update");

  const payload: any = { 
    ...updates, 
    id: uid,
    updated_at: new Date().toISOString() 
  };

  delete payload.is_admin;
  delete payload.created_at;
  delete payload.email;

  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateExpertVerificationStatus = async (userId: string, status: VerificationStatus) => {
  const { error } = await supabase
    .from('profiles')
    .update({ verification_status: status })
    .eq('id', userId);
    
  if (error) throw error;
};

export const updateProfileStatus = async (userId: string, status: 'approved' | 'rejected', reason?: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      bio_verification_status: status, 
      bio_rejection_reason: reason || null, 
      is_profile_online: status === 'approved' 
    })
    .eq('id', userId);

  if (error) throw error;
};

export const getUserProfile = async (uid: string) => {
  const { data, error = null } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data;
};

export const setUserRole = async (role: UserType) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user found");
  return await updateUserProfile(user.id, { role_selected: true, is_pro: role === 'pro', is_expat: role === 'expat' });
};

export const getUnlockedPros = async (uid: string): Promise<Record<string, UnlockToken>> => {
  const { data, error } = await supabase.from('unlocks').select('pro_id, unlocked_at').eq('user_id', uid);
  if (error) return {};
  const tokens: Record<string, UnlockToken> = {};
  data.forEach(u => { tokens[u.pro_id] = { id: u.pro_id, unlockDate: new Date(u.unlocked_at).getTime(), hasReviewed: false }; });
  return tokens;
};

export const getUserReviews = async (uid: string): Promise<Review[]> => {
  const { data, error } = await supabase.from('reviews').select('*, profiles:pro_id(full_name)').eq('user_id', uid);
  if (error) return [];
  return data.map(r => ({
    id: r.id, proId: r.pro_id, userId: r.user_id, serviceType: r.service_type, stars: r.stars, testimonies: r.testimonies,
    date: new Date(r.created_at).getTime(), status: r.status, isVerified: r.status === 'verified', isAnonymous: r.is_anonymous, proName: r.profiles?.full_name
  }));
};

export const mapDBRowToPro = (row: any): Professional => ({
  id: row.id,
  name: row.full_name || '',
  gender: row.gender || 'prefer-not-to-say',
  nationalities: row.nationality || [],
  yearsOfExperience: row.years_experience || 0,
  professions: row.professions || [],
  specialties: row.specialties || [],
  specialtyTranslations: row.specialty_translations || {},
  cities: row.all_cities || [],
  languages: row.languages || [],
  rating: row.rating || 5.0,
  reviews: row.reviews_count || 0,
  image: row.pro_image_url || row.avatar_url || '',
  bio: row.bio || '',
  bios: row.bios || {},
  verified: row.verification_status === 'verified',
  verificationStatus: row.verification_status || 'none',
  bioVerificationStatus: row.bio_verification_status || 'pending',
  isFeatured: row.is_featured || false,
  isEarlyMember: row.pro_plan ? (row.pro_plan.toLowerCase().includes('early') || row.pro_plan.toLowerCase().includes('founding')) : false,
  phone: row.phone,
  whatsapp_number: row.whatsapp_number,
  email_pro: row.email_pro,
  websiteUrl: row.website_url,
  bookingUrl: row.booking_url,
  address: row.address,
  latitude: row.location_lat,
  longitude: row.location_lng,
  isProfileOnline: row.is_profile_online,
  is_admin: row.is_admin,
  is_pro_complete: row.is_pro_complete,
  documentUrl: row.verification_documents,
  distance_km: row.distance_km
});

export const deleteUserProfile = async (uid: string) => {
  const { error } = await supabase.rpc('delete_own_user');
  if (error) throw error;
  return { success: true };
};

export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const saveUnlock = async (userId: string, proId: string) => {
  const { error } = await supabase.from('unlocks').insert({ user_id: userId, pro_id: proId });
  if (error) throw error;
};

export const updateUserCredits = async (userId: string, credits: number) => {
  const { error } = await supabase.from('profiles').update({ credits }).eq('id', userId);
  if (error) throw error;
};

export const setPremiumStatus = async (userId: string) => {
  const premiumUntil = new Date();
  premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
  
  const { error } = await supabase.from('profiles').update({ 
    is_premium: true, 
    premium_until: premiumUntil.toISOString() 
  }).eq('id', userId);
  if (error) throw error;
};

export const submitProfessionalReview = async (userId: string, proId: string, stars: number, testimonies: string, serviceType: string, isAnonymous: boolean) => {
  const { error } = await supabase.from('reviews').insert({ user_id: userId, pro_id: proId, stars, testimonies, service_type: serviceType, is_anonymous: isAnonymous, status: 'pending' });
  if (error) throw error;
};

export const updateUserPlan = async (userId: string, planName: string) => {
  const { data, error = null } = await supabase.from('profiles').update({ 
    pro_plan: planName, 
    plan_status: 'active', 
    is_subscribed: true,
    cancel_at_period_end: false
  }).eq('id', userId).select().single();
  
  if (error) throw error;
  return data;
};

export const incrementProfileUnlocks = async (proId: string) => {
  const { data, error } = await supabase.rpc('increment_pro_unlocks', { pro_id: proId });
  if (error) throw error;
  return data;
};

export const getProfessionalsWithDistance = async (lat: number, lng: number, profession?: string, language?: string, city?: string): Promise<Professional[]> => {
  try {
    let query = supabase.from('profiles')
      .select(PRO_MINIMAL_COLUMNS)
      .eq('is_pro', true)
      .eq('is_profile_online', true)
      .eq('bio_verification_status', 'approved'); 
    
    if (profession) query = query.contains('professions', [profession]);
    if (language) query = query.contains('languages', [language]);
    
    if (city && (!lat || lat === 0)) {
        // Try to match the city name more flexibly (Capitalized)
        const normalizedCity = city.trim().split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        query = query.contains('all_cities', [normalizedCity]);
    }
    
    query = query.order('is_featured', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    let results = (data || []).map(mapDBRowToPro);
    
    if (lat && lng) {
      results = results.map(pro => {
        if (pro.latitude && pro.longitude) {
          pro.distance_km = calculateHaversineDistance(lat, lng, pro.latitude, pro.longitude);
        }
        return pro;
      });
      
      const prosWithin100km = results.filter(p => (p.distance_km ?? 9999) <= 100);
      
      if (prosWithin100km.length > 0) {
        // If there are pros within 100km, only show those
        results = prosWithin100km;
        results.sort((a, b) => {
          // Prioritize featured pros within the 100km radius
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          
          const distA = a.distance_km ?? 9999;
          const distB = b.distance_km ?? 9999;
          if (Math.abs(distA - distB) > 0.1) return distA - distB;
          return (b.rating || 0) - (a.rating || 0);
        });
      } else {
        // If no pros within 100km, show all sorted by distance
        results.sort((a, b) => {
          const distA = a.distance_km ?? 9999;
          const distB = b.distance_km ?? 9999;
          if (distA !== distB) return distA - distB;
          return (b.rating || 0) - (a.rating || 0);
        });
      }
    } else {
      results.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
    }
    
    return results.slice(0, 6);
  } catch (err: any) {
    console.error("Search error:", err);
    throw new Error(err.message === "Failed to fetch" ? "Unable to connect to the database. Check your connection." : err.message);
  }
};

export const cancelUserPlan = async (userId: string) => {
  const { data, error } = await supabase.from('profiles')
    .update({ 
      plan_status: 'cancelling',
      cancel_at_period_end: true 
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const reactivateUserPlan = async (userId: string) => {
  const { data, error } = await supabase.from('profiles')
    .update({ 
      cancel_at_period_end: false, 
      plan_status: 'active' 
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getProStats = async (proId: string) => {
  const { data, error = null } = await supabase.from('profiles').select('profile_views, profile_unlocks, reviews_count, rating').eq('id', proId).single();
  if (error) return { profile_views: 0, profile_unlocks: 0, reviews_count: 0, rating: 5.0 };
  return data;
};

export const uploadVerificationDocs = async (proId: string, files: File[]) => {
  const urls = [];
  for (const file of files) {
    const dataToUpload = file.type === 'application/pdf' ? file : await compressImage(file);
    const fileExt = file.type === 'application/pdf' ? 'pdf' : 'jpg';
    const filePath = `${proId}/verify_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('verification-docs').upload(filePath, dataToUpload);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('verification-docs').getPublicUrl(filePath);
    urls.push(publicUrl);
  }
  const { error: updateError = null } = await supabase.from('profiles').update({ verification_documents: urls, verification_status: 'pending' }).eq('id', proId);
  if (updateError) throw updateError;
};

export const getProfessionalReviews = async (proId: string, viewerId?: string): Promise<Review[]> => {
  const { data, error = null } = await supabase.from('reviews').select('*, profiles:user_id(full_name, avatar_url)').eq('pro_id', proId).eq('status', 'verified');
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, proId: r.pro_id, userId: r.user_id, serviceType: r.service_type, stars: r.stars, testimonies: r.testimonies,
    date: new Date(r.created_at).getTime(), status: r.status, isVerified: true, isAnonymous: r.is_anonymous,
    userName: r.is_anonymous ? undefined : r.profiles?.full_name, userAvatar: r.is_anonymous ? undefined : r.profiles?.avatar_url
  }));
};

export const getAllReviewsForAdmin = async (): Promise<Review[]> => {
  const { data, error = null } = await supabase.from('reviews').select('*, user:user_id(full_name), pro:pro_id(full_name)').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(r => ({
    id: r.id, proId: r.pro_id, userId: r.user_id, serviceType: r.service_type, stars: r.stars, testimonies: r.testimonies,
    date: new Date(r.created_at).getTime(), status: r.status, isVerified: r.status === 'verified', isAnonymous: r.is_anonymous,
    userName: r.user?.full_name || 'Unknown', proName: r.pro?.full_name || 'Unknown'
  }));
};

export const updateReviewStatus = async (reviewId: string, status: ReviewStatus, testimonies?: string) => {
  const updates: any = { status };
  if (testimonies) updates.testimonies = testimonies;
  const { error } = await supabase.from('reviews').update(updates).eq('id', reviewId);
  if (error) throw error;
};

export const updateReviewText = async (reviewId: string, text: string) => {
  const { error } = await supabase.from('reviews').update({ testimonies: text }).eq('id', reviewId);
  if (error) throw error;
};

export const getPendingVerificationProfiles = async (): Promise<Professional[]> => {
  const { data, error = null } = await supabase.from('profiles').select('*').eq('verification_status', 'pending');
  if (error || !data) return [];
  return data.map(mapDBRowToPro);
};

export const getPendingProfiles = async (): Promise<Professional[]> => {
  const { data, error = null } = await supabase.from('profiles').select('*').eq('bio_verification_status', 'pending').eq('is_pro_complete', true);
  if (error || !data) return [];
  return data.map(mapDBRowToPro);
};

export const getSupportMessages = async (): Promise<any[]> => {
  const { data, error = null } = await supabase.from('support_messages').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
};

export const compressAndUploadImage = async (file: File, bucket: string, userId: string, prefix: string) => {
  const dataToUpload = await compressImage(file);
  const filePath = `${userId}/${prefix}_${Date.now()}.jpg`;
  
  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, dataToUpload);
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
};

export const getActiveProfessionalProfiles = async (): Promise<Professional[]> => {
  const { data, error = null } = await supabase.from('profiles').select(PRO_MINIMAL_COLUMNS).eq('is_pro', true).eq('is_profile_online', true);
  if (error || !data) return [];
  return data.map(mapDBRowToPro);
};

export const fetchProDetails = async (proId: string, includePrivate: boolean): Promise<Partial<Professional> | null> => {
  const columns = includePrivate ? `${PRO_MINIMAL_COLUMNS}, ${PRO_PRIVATE_COLUMNS}` : PRO_MINIMAL_COLUMNS;
  const { data, error = null } = await supabase.from('profiles').select(columns).eq('id', proId).single();
  if (error) return null;
  return mapDBRowToPro(data);
};