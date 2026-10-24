import type { AccountSummary } from './account';

export interface AiExtraction {
  documentType: string | null;
  certificateNumber: string | null;
  businessName: string | null;
  issuingAuthority: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  complianceCategory: string | null;
  confidence: number;
  summary: string;
  demoMode: boolean;
  provider: string;
  account: AccountSummary;
}
