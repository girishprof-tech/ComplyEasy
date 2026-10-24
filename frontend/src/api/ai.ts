import { request } from './client';
import type { AiExtraction, CertificatePayload } from '@/types';

export const aiApi = {
  /** Transient: nothing is saved until the item itself is saved. */
  analyzeCertificate: (payload: CertificatePayload, businessNameHint?: string) =>
    request<AiExtraction>('POST', '/api/ai/analyze-certificate', { ...payload, businessNameHint }),
};
