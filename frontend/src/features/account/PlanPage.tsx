import { useEffect, useState } from 'react';
import { accountApi } from '@/api';
import type { AccountSummary, PlanTier } from '@/types';
import { PageLoading } from '@/shared/components/PageStates';
import { errorMessage } from '@/shared/lib/errors';
import { useAuth } from '@/features/auth/state/AuthProvider';

export function PlanPage() {
  const { me } = useAuth();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    accountApi
      .get()
      .then(setAccount)
      .catch((e) => setError(e.message));
  }, []);

  async function switchTier(tier: PlanTier) {
    setBusy(true);
    setError(null);
    try {
      setAccount(await accountApi.setPlan(tier));
    } catch (err) {
      setError(errorMessage(err, 'Could not change plan.'));
    } finally {
      setBusy(false);
    }
  }

  if (!account) return <PageLoading />;

  const isAccountant = me?.role === 'accountant';

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="eyebrow">Your plan</div>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>
        Billing{' '}
        <span className={`plan-badge ${account.tier}`} style={{ marginLeft: 10, verticalAlign: 'middle' }}>
          {account.label}
        </span>
      </h1>
      <p className="form-note" style={{ marginBottom: 8 }}>
        This is a demo upgrade flow — no payment is collected. Switching plans takes effect immediately.
      </p>
      {error && <div className="form-error">{error}</div>}

      <div className="card card-pad" style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
          AI certificate analyses used: <strong>{account.aiAnalysesUsed}</strong>
          {account.aiAnalysesRemaining !== null && <> · {account.aiAnalysesRemaining} remaining on your plan</>}
        </div>
      </div>

      <div className="plan-grid">
        <div className={`plan-card ${account.tier === 'free' ? 'current' : ''}`}>
          <h3>Free</h3>
          <div className="plan-price">₹0</div>
          <ul>
            <li>{isAccountant ? 'Up to 2 clients' : 'Your one business'}</li>
            <li>5 AI certificate analyses (lifetime)</li>
            <li>Compliance Health &amp; AI Insight cards</li>
            <li>CSV export — not included</li>
            <li>Shows a few demo ads</li>
          </ul>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            disabled={busy || account.tier === 'free'}
            onClick={() => switchTier('free')}
          >
            {account.tier === 'free' ? 'Current plan' : 'Switch to Free'}
          </button>
        </div>

        <div className={`plan-card ${account.tier === 'pro' ? 'current' : ''}`}>
          <h3>Pro</h3>
          <div className="plan-price">₹999/mo</div>
          <ul>
            <li>{isAccountant ? 'Unlimited clients' : 'Your one business'}</li>
            <li>Unlimited AI certificate analyses</li>
            <li>Compliance Health &amp; AI Insight cards</li>
            <li>One-click CSV compliance register export</li>
            <li>No ads</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={busy || account.tier === 'pro'}
            onClick={() => switchTier('pro')}
          >
            {account.tier === 'pro' ? 'Current plan' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
    </div>
  );
}
