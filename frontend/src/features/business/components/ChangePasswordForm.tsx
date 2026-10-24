import { useState, type FormEvent } from 'react';
import { authApi } from '@/api';
import { Field } from '@/shared/components/Field';
import { errorMessage } from '@/shared/lib/errors';

export function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setOk(true);
      setTimeout(onDone, 1200);
    } catch (err) {
      setError(errorMessage(err, 'Could not change password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      {error && <div className="form-error">{error}</div>}
      {ok && (
        <div className="form-note" style={{ color: 'var(--active)' }}>
          Password updated.
        </div>
      )}
      <Field
        id="currentPassword"
        label="Current password"
        type="password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <Field
        id="newPassword"
        label="New password"
        type="password"
        required
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}
