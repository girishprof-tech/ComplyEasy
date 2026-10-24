import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { errorMessage } from '@/shared/lib/errors';
import { homePathFor, useAuth } from '../state/AuthProvider';

export function LoginPage() {
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
      const me = await authApi.login(email, password);
      setMe(me);
      navigate(homePathFor(me));
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center-page">
      <div className="container-narrow">
        <div className="eyebrow">Welcome back</div>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>Log in to Venture</h1>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <Field id="email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="form-note" style={{ marginTop: 20 }}>
          New accountant? <Link to="/register">Create an account</Link>
        </p>
        <p className="form-note">
          Client with an invite link? Use the link your accountant sent you to activate your login.
        </p>
      </div>
    </div>
  );
}
