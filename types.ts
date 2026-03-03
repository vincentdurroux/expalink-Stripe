export type UserType = 'expat' | 'pro' | 'admin';
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type ReviewStatus = 'pending' | 'verified' | 'rejected';

// Define the type for bio verification status
export type BioVerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  proId: string;
  userId?: string;
  serviceType: string;
  stars: number;
  testimonies: string;
  date: number;
  status: ReviewStatus;
  isVerified: boolean;
  isAnonymous: boolean;
  proName?: string;
  userName?: string;
  userAvatar?: string;
}

export interface UnlockToken {
  id: string; // proId
  unlockDate: number;
  hasReviewed: boolean;
}

export interface Professional {
  id: string;
  name: string;
  gender: Gender;
  nationalities?: string[];
  companyName?: string;
  yearsOfExperience: number;
  professions: string[];
  specialties: string[];
  specialtyTranslations?: Record<string, Record<string, string>>;
  cities: string[];
  languages: string[];
  rating: number;
  reviews: number;
  profileViews?: number;
  profileUnlocks?: number;
  verifiedReviews?: Review[];
  image: string;
  bio: string;
  bios?: Record<string, string>;
  verified: boolean;
  verificationStatus?: VerificationStatus;
  // Add bio verification status to Professional interface
  bioVerificationStatus?: BioVerificationStatus;
  documentUrl?: string | string[];
  isFeatured?: boolean;
  isEarlyMember?: boolean;
  isElite?: boolean;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  email_pro?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  location?: string; // Format: POINT(lng lat)
  verificationDocuments?: string[];
  isProfileOnline?: boolean;
  is_admin?: boolean;
  is_pro_complete?: boolean;
  distance_km?: number;
  searchOriginName?: string;
}

export interface SearchFilters {
  profession: string;
  city: string;
  language: string;
}

export interface RecommendationResponse {
  reasoning: string;
  suggestedAction: string;
}