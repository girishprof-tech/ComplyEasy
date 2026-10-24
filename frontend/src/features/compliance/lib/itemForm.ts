import type { AiExtraction, ComplianceItem, ComplianceItemInput } from '@/types';
import type { CertificateFieldValue } from '../components/CertificateField';

/** Form values for the add/edit compliance item dialog (all plain strings). */
export interface ItemFormState {
  name: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
  category: string;
  extractedDocumentType: string;
  extractedCertificateNumber: string;
  extractedIssuingAuthority: string;
}

/** Values pre-filled when an item is started from an "Area to Review" suggestion. */
export interface ItemPrefill {
  name?: string;
  category?: string;
}

export function initialItemForm(item?: ComplianceItem, prefill?: ItemPrefill | null): ItemFormState {
  return {
    name: item?.name || prefill?.name || '',
    issueDate: item?.issueDate || '',
    expiryDate: item?.expiryDate || '',
    notes: item?.notes || '',
    category: item?.category || prefill?.category || '',
    extractedDocumentType: item?.extractedDocumentType || '',
    extractedCertificateNumber: item?.extractedCertificateNumber || '',
    extractedIssuingAuthority: item?.extractedIssuingAuthority || '',
  };
}

/**
 * The AI's output is only ever a suggestion: it fills fields the user has not
 * already typed into and never overwrites anything. Saving the form is what
 * persists it.
 */
export function applyExtraction(form: ItemFormState, x: AiExtraction): ItemFormState {
  return {
    ...form,
    name: form.name || x.documentType || '',
    issueDate: form.issueDate || x.issueDate || '',
    expiryDate: form.expiryDate || x.expiryDate || '',
    category: form.category || x.complianceCategory || '',
    extractedDocumentType: form.extractedDocumentType || x.documentType || '',
    extractedCertificateNumber: form.extractedCertificateNumber || x.certificateNumber || '',
    extractedIssuingAuthority: form.extractedIssuingAuthority || x.issuingAuthority || '',
  };
}

/** Builds the request body. `certificate` is omitted when unchanged, `null` when removed. */
export function toItemInput(form: ItemFormState, cert: CertificateFieldValue): ComplianceItemInput {
  const input: ComplianceItemInput = {
    name: form.name,
    issueDate: form.issueDate,
    expiryDate: form.expiryDate,
    notes: form.notes,
    category: form.category || null,
    extractedDocumentType: form.extractedDocumentType || null,
    extractedCertificateNumber: form.extractedCertificateNumber || null,
    extractedIssuingAuthority: form.extractedIssuingAuthority || null,
  };
  if (cert.kind === 'new') input.certificate = cert.payload;
  else if (cert.kind === 'removed') input.certificate = null;
  return input;
}
