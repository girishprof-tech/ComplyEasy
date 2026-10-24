import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { errorMessage } from '@/shared/lib/errors';
import { useAuth } from '../state/AuthProvider';

/** Landing page for an accountant's invite link: /activate?token=… */
export function ActivatePage() {
  const navigate = useNavigate();
  const { setMe } = useAuth();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const me = await authApi.activate(token, email, password);
      setMe(me);
      navigate('/portal');
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="center-page">
        <div className="container-narrow">
          <div className="form-error">This invite link is missing its token. Ask your accountant to resend it.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="center-page">
      <div className="container-narrow">
        <div className="eyebrow">Activate your login</div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Set up your account</h1>
        <p className="form-note" style={{ marginBottom: 24 }}>
          Your accountant added your business to Venture. Choose your login email and a password to see your
          compliance status any time.
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
            {busy ? 'Activating…' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  );
}
