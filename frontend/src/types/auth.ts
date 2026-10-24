export type Role = 'accountant' | 'owner';

/** The signed-in user, as returned by /api/auth/me and the login/signup endpoints. */
export interface Me {
  userId: number;
  role: Role;
  email: string;
  firmName?: string | null;
  businessId?: number | null;
  businessName?: string | null;
}
