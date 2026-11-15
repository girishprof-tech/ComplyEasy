import { useState, type FormEvent } from 'react';
import { clientsApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { Modal } from '@/shared/components/Modal';
import { BusinessLogo } from '@/shared/components/BusinessLogo';
import { errorMessage } from '@/shared/lib/errors';

export function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [logoData, setLogoData] = useState<string | null>(null);
  const [values, setValues] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    location: '',
    registrationId: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bind = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await clientsApi.create({ ...values, logoData });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Could not add client.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add a client" onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 16,
            padding: 12,
            background: 'var(--surface-tint)',
            borderRadius: 10,
            border: '1px solid var(--hairline)',
          }}
        >
          <BusinessLogo
            name={values.businessName || 'Client'}
            logoData={logoData}
            size={48}
            editable
            onUpload={(data) => setLogoData(data)}
            onRemove={() => setLogoData(null)}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Client Logo (Optional)</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
              Click avatar to attach brand logo. Can also be set later.
            </div>
          </div>
        </div>

        <Field id="businessName" label="Business name" required {...bind('businessName')} />
        <Field id="businessType" label="Business type" placeholder="e.g. Private Limited" {...bind('businessType')} />
        <Field id="industry" label="Industry" placeholder="e.g. Textiles" {...bind('industry')} />
        <Field id="location" label="Location" placeholder="City, State" {...bind('location')} />
        <Field id="registrationId" label="GSTIN / MSME registration ID" {...bind('registrationId')} />
        <Field id="contactPerson" label="Contact person" {...bind('contactPerson')} />
        <Field id="contactEmail" label="Contact email" type="email" {...bind('contactEmail')} />
        <Field id="contactPhone" label="Contact phone" {...bind('contactPhone')} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>
            {busy ? 'Adding…' : 'Add client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
