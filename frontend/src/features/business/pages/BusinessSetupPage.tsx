import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { myBusinessApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { errorMessage } from '@/shared/lib/errors';
import { useAuth } from '@/features/auth/state/AuthProvider';

/** Post-signup step for self-registered owners: create their business record. */
export function BusinessSetupPage() {
  const navigate = useNavigate();
  const { setMe, me } = useAuth();
  const [values, setValues] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    location: '',
    contactPerson: '',
    contactEmail: me?.email || '',
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
      const business = await myBusinessApi.create(values);
      if (me) setMe({ ...me, businessId: business.id, businessName: business.businessName });
      navigate('/portal');
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-page">
      <div className="container-narrow">
        <div className="eyebrow">Almost there</div>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>Set up your business</h1>
        <p className="form-note" style={{ marginBottom: 24 }}>
          This is the business you'll track compliance for. You can update these details any time.
        </p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <Field id="businessName" label="Business name" required {...bind('businessName')} />
          <Field
            id="businessType"
            label="Business type"
            placeholder="e.g. Private Limited, Proprietorship, Partnership"
            {...bind('businessType')}
          />
          <Field id="industry" label="Industry" placeholder="e.g. Textiles, Manufacturing, Retail" {...bind('industry')} />
          <Field id="location" label="Location" placeholder="City, State" {...bind('location')} />
          <Field id="contactPerson" label="Contact person" {...bind('contactPerson')} />
          <Field id="contactEmail" label="Contact email" type="email" {...bind('contactEmail')} />
          <Field id="contactPhone" label="Contact phone" {...bind('contactPhone')} />
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Setting up…' : 'Create business'}
          </button>
        </form>
      </div>
    </div>
  );
}
