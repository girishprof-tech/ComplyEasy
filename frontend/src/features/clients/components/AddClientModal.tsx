import { useState, type FormEvent } from 'react';
import { clientsApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { Modal } from '@/shared/components/Modal';
import { errorMessage } from '@/shared/lib/errors';

export function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
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
      await clientsApi.create(values);
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
