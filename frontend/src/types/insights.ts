export interface HealthSummary {
  score: number;
  totalItems: number;
  active: number;
  expiringSoon: number;
  expired: number;
  businessCount?: number;
  businessesNeedingAttention?: number;
  reviewCount?: number | null;
  highestPriority: string | null;
  summary: string;
  demoMode: boolean;
}

// "Areas to Review" — every status is a possibility to check, never a
// determination (see backend SuggestionEngine for the product boundary).
export type SuggestionStatus = 'review_recommended' | 'documented' | 'expiring_soon' | 'expired_document';

export interface Suggestion {
  id: string;
  name: string;
  category: string;
  reason: string;
  status: SuggestionStatus;
  statusLabel: string;
  matchedItemId: number | null;
  matchedItemName: string | null;
  daysUntilExpiry: number | null;
  source: 'system_suggestion';
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  needingReviewCount: number;
  disclaimer: string;
}

export interface ActivityEntry {
  id: number;
  eventType: string;
  description: string;
  createdAt: string;
}

export interface SchemeMatch {
  id: string;
  name: string;
  category: string;
  description: string;
  benefitSummary: string;
  sourceName: string;
  sourceUrl: string;
  lastCheckedAt: string;
  needsMoreInfo: boolean;
}

export interface WebSource {
  title: string;
  url: string;
}

export interface SchemeDiscoveryResult {
  summary: string | null;
  sources: WebSource[];
  disclaimer: string | null;
  unavailable?: boolean;
  reason?: string;
  discoveredAt?: string;
}

export interface SustainabilityRecommendation {
  id: string;
  category: string;
  text: string;
}

export interface SustainabilityInputs {
  electricityNotes: string | null;
  transportNotes: string | null;
  wasteNotes: string | null;
  waterNotes: string | null;
  updatedAt: string;
}

export interface SustainabilityResponse {
  recommendations: SustainabilityRecommendation[];
  userProvidedContext: SustainabilityInputs | null;
}
