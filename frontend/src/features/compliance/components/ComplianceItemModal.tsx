import { useMemo, useState, type FormEvent } from 'react';
import { certificateUrl, scopedApi, type BusinessScope } from '@/api';
import type { AiExtraction, ComplianceItem } from '@/types';
import { Field, TextAreaField } from '@/shared/components/Field';
import { Modal } from '@/shared/components/Modal';
import { errorMessage } from '@/shared/lib/errors';
import { applyExtraction, initialItemForm, toItemInput, type ItemFormState, type ItemPrefill } from '../lib/itemForm';
import { AiExtractionReview } from './AiExtractionReview';
import { AiInsightCard } from './AiInsightCard';
import { CertificateField, type CertificateFieldValue, type ExistingCertificate } from './CertificateField';

interface Props {
  /** Whose item this is — an owner's own business, or one of an accountant's clients. */
  scope: BusinessScope;
  /** Present when editing; absent when adding. */
  item?: ComplianceItem;
  prefill?: ItemPrefill | null;
  onClose: () => void;
  onSaved: () => void;
}

/** The add/edit compliance item dialog, shared by owners and accountants. */
export function ComplianceItemModal({ scope, item, prefill, onClose, onSaved }: Props) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const [form, setForm] = useState<ItemFormState>(() => initialItemForm(item, prefill));
  const [certValue, setCertValue] = useState<CertificateFieldValue>({ kind: 'unchanged' });
  const [aiExtraction, setAiExtraction] = useState<AiExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const existingCert: ExistingCertificate | null =
    item && item.hasCertificate
      ? {
          originalName: item.certificateOriginalName,
          mimeType: item.certificateMimeType,
          viewUrl: certificateUrl(scope, item.id),
          downloadUrl: certificateUrl(scope, item.id, true),
        }
      : null;

  const set = (field: keyof ItemFormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleAnalyzed(extraction: AiExtraction) {
    setAiExtraction(extraction);
    setForm((f) => applyExtraction(f, extraction));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const input = toItemInput(form, certValue);
      if (item) await api.updateItem(item.id, input);
      else await api.createItem(input);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save item.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={item ? 'Edit compliance item' : 'Add compliance item'} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <CertificateField existing={existingCert} value={certValue} onChange={setCertValue} onAnalyzed={handleAnalyzed} />
        {aiExtraction && <AiExtractionReview extraction={aiExtraction} />}
        {item && !aiExtraction && <AiInsightCard insight={item.aiInsight} />}
        <div style={{ marginTop: 18 }}>
          <Field id="name" label="Name" required placeholder="e.g. GST Registration" value={form.name} onChange={set('name')} />
        </div>
        <Field id="issueDate" label="Issue date" type="date" value={form.issueDate} onChange={set('issueDate')} />
        <Field id="expiryDate" label="Expiry date" type="date" required value={form.expiryDate} onChange={set('expiryDate')} />
        <Field
          id="category"
          label="Category"
          placeholder="e.g. Tax, Safety, Environmental"
          value={form.category}
          onChange={set('category')}
        />
        <TextAreaField id="notes" label="Notes" rows={3} value={form.notes} onChange={set('notes')} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>
            {busy ? 'Saving…' : item ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
