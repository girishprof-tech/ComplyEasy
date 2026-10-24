export type ItemStatus = 'active' | 'expiring_soon' | 'expired';

/** What the uploader sends to create or replace a certificate. */
export interface CertificatePayload {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

export interface AiInsight {
  headline: string;
  body: string;
  level: 'ok' | 'warn' | 'risk';
}

export interface ComplianceItem {
  id: number;
  clientId?: number;
  name: string;
  issueDate: string | null;
  expiryDate: string;
  notes: string | null;
  status: ItemStatus;
  daysUntilExpiry: number;
  daysLabel: string;
  hasCertificate: boolean;
  certificateOriginalName: string | null;
  certificateMimeType: string | null;
  certificateSize: number | null;
  extractedDocumentType: string | null;
  extractedCertificateNumber: string | null;
  extractedIssuingAuthority: string | null;
  category: string | null;
  aiInsight: AiInsight;
}

export interface ComplianceItemInput {
  name: string;
  issueDate?: string | null;
  expiryDate: string;
  notes?: string | null;
  /** Omit the key to leave the certificate as-is; `null` removes it. */
  certificate?: CertificatePayload | null;
  extractedDocumentType?: string | null;
  extractedCertificateNumber?: string | null;
  extractedIssuingAuthority?: string | null;
  category?: string | null;
}
