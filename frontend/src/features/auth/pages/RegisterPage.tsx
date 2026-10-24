import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import type { Role } from '@/types';
import { Field } from '@/shared/components/Field';
import { errorMessage } from '@/shared/lib/errors';
import { useAuth } from '../state/AuthProvider';

export function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="center-page">
      <div className="container-narrow" style={{ maxWidth: selectedRole ? 460 : 560 }}>
        {!selectedRole ? (
          <>
            <div className="eyebrow">Get started</div>
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>What best describes you?</h1>
            <p className="form-note" style={{ marginBottom: 20 }}>
              This decides what your Venture account looks like — you can't switch it later.
            </p>
            <div className="role-grid">
              <button type="button" className="role-card" onClick={() => setSelectedRole('owner')}>
                <div className="role-icon">B</div>
                <h3>Business Owner</h3>
                <p>Manage compliance for my own business.</p>
              </button>
              <button type="button" className="role-card" onClick={() => setSelectedRole('accountant')}>
                <div className="role-icon">A</div>
                <h3>Accountant</h3>
                <p>Manage compliance for multiple businesses.</p>
              </button>
            </div>
            <p className="form-note" style={{ marginTop: 24 }}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        ) : selectedRole === 'accountant' ? (
          <AccountantSignupForm onBack={() => setSelectedRole(null)} />
        ) : (
          <OwnerSignupForm onBack={() => setSelectedRole(null)} />
        )}
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" className="btn-ghost btn" onClick={onBack} style={{ marginBottom: 12, paddingLeft: 0 }}>
      ← Back
    </button>
  );
}

function AccountantSignupForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { setMe } = useAuth();
  const [firmName, setFirmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const me = await authApi.signupAccountant(email, password, firmName);
      setMe(me);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <div className="eyebrow">For accountants</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Start your client book</h1>
      <p className="form-note" style={{ marginBottom: 24 }}>
        This creates an accountant account. Your clients don't sign up here — you'll invite each one once you've
        added their record.
      </p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field id="firmName" label="Firm name" required value={firmName} onChange={(e) => setFirmName(e.target.value)} />
        <Field id="email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </>
  );
}

function OwnerSignupForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const { setMe } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const me = await authApi.signupOwner(email, password);
      setMe(me);
      navigate('/business-setup');
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BackButton onBack={onBack} />
      <div className="eyebrow">For business owners</div>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>Create your account</h1>
      <p className="form-note" style={{ marginBottom: 24 }}>
        Next you'll set up your business — no accountant needed to get started.
      </p>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <Field id="email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating account…' : 'Continue'}
        </button>
      </form>
    </>
  );
}
