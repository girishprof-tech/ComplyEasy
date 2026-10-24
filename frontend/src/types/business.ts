export type LoginStatus = 'not_invited' | 'invited' | 'active';

/**
 * A business record. For accountants this is one of their clients; for
 * owners it is their own business (the backend table is historically
 * called "clients").
 */
export interface Business {
  id: number;
  businessName: string;
  businessType: string | null;
  industry: string | null;
  location: string | null;
  registrationId: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  hasAccountant: boolean;
  loginStatus: LoginStatus;
  createdAt: string;
}

export type BusinessInput = Partial<Omit<Business, 'id' | 'hasAccountant' | 'loginStatus' | 'createdAt'>>;

export interface InviteResult {
  inviteUrl: string;
  expiresAt: string;
}
