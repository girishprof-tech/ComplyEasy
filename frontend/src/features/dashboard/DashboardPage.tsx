import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, exportCsvUrl } from '@/api';
import type { DashboardSummary } from '@/types';
import { PageError, PageLoading } from '@/shared/components/PageStates';
import { StatRow } from '@/shared/components/StatRow';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ExportCsvButton } from '@/features/account/components/ExportCsvButton';
import { useAccount } from '@/features/account/hooks/useAccount';
import { AdBanner } from '@/shared/components/AdBanner';
import { useAuth } from '@/features/auth/state/AuthProvider';
import { HealthSummaryCard } from '@/features/insights/components/HealthSummaryCard';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** An accountant's cross-client dashboard. */
export function DashboardPage() {
  const navigate = useNavigate();
  const account = useAccount();
  const { me } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [filterClient, setFilterClient] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setSummary)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <PageError message={error} />;
  if (!summary) return <PageLoading />;

  const clientNames = Array.from(new Set(summary.urgentItems.map((i) => i.clientName))).sort();
  const filtered =
    filterClient === 'all' ? summary.urgentItems : summary.urgentItems.filter((i) => i.clientName === filterClient);

  return (
    <div className="container">
      <div className="eyebrow">Your whole book, one screen</div>
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 2 }}>Dashboard</h2>
          <p className="page-sub">
            {greeting()}
            {me?.firmName ? `, ${me.firmName}` : ''} — here is what needs your attention.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ExportCsvButton account={account} href={exportCsvUrl.accountant} />
          <Link to="/clients" className="btn btn-secondary">
            Manage clients
          </Link>
        </div>
      </div>

      <StatRow
        stats={[
          { label: 'Total clients', value: summary.totalClients },
          { label: 'Active items', value: summary.active, tone: 'ok' },
          { label: 'Expiring in 30 days', value: summary.expiringSoon, tone: 'warn' },
          { label: 'Already expired', value: summary.expired, tone: 'danger' },
        ]}
      />

      <div className="layout">
      <div className="card card-pad">
        <div className="section-head">
          <h2>Most urgent, across all clients</h2>
          {clientNames.length > 0 && (
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              style={{ border: '1px solid var(--hairline)', borderRadius: 8, padding: '7px 10px', fontSize: 13 }}
            >
              <option value="all">All clients</option>
              {clientNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing urgent right now</h3>
            <p>Items expiring within 30 days, or already expired, will show up here across every client you manage.</p>
          </div>
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Client</th>
                <th>Item</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="clickable" onClick={() => navigate(`/clients/${item.clientId}`)}>
                  <td>{item.clientName}</td>
                  <td className="num">{item.name}</td>
                  <td className="num">
                    {item.expiryDate} (
                    {item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)}d ago` : `in ${item.daysUntilExpiry}d`})
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <aside className="rail">
        <HealthSummaryCard title="Portfolio Health" health={summary.portfolioHealth} />
        <AdBanner account={account} slot={0} />
      </aside>
      </div>
    </div>
  );
}
