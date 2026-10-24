import { describe, expect, it } from 'vitest';
import type { AiExtraction } from '@/types';
import { applyExtraction, initialItemForm, toItemInput } from './itemForm';

const extraction = {
  documentType: 'Fire NOC',
  certificateNumber: 'ABC123',
  issuingAuthority: 'State Fire Department',
  issueDate: '2025-01-01',
  expiryDate: '2026-01-01',
  complianceCategory: 'Safety',
} as AiExtraction;

describe('applyExtraction', () => {
  it('fills empty fields', () => {
    const f = applyExtraction(initialItemForm(), extraction);
    expect(f.name).toBe('Fire NOC');
    expect(f.expiryDate).toBe('2026-01-01');
    expect(f.extractedCertificateNumber).toBe('ABC123');
  });

  it('never overwrites what the user typed', () => {
    const f = applyExtraction({ ...initialItemForm(), name: 'My name', expiryDate: '2030-05-05' }, extraction);
    expect(f.name).toBe('My name');
    expect(f.expiryDate).toBe('2030-05-05');
    expect(f.issueDate).toBe('2025-01-01');
  });
});

describe('toItemInput', () => {
  it('omits certificate when unchanged, nulls it when removed', () => {
    const form = initialItemForm();
    expect('certificate' in toItemInput(form, { kind: 'unchanged' })).toBe(false);
    expect(toItemInput(form, { kind: 'removed' }).certificate).toBeNull();
  });
});
