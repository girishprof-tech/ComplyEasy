import type { Business, BusinessInput } from './business';
import type { PlanTier } from './account';

export interface UserProfileDetail {
  userId: number;
  email: string;
  role: 'accountant' | 'owner';
  firmName?: string;
  business?: Business | null;
  subscriptionTier: PlanTier;
  aiAnalysesUsed: number;
  createdAt: string;
}

export interface UpdateProfilePayload {
  firmName?: string;
  businessDetails?: BusinessInput;
}
