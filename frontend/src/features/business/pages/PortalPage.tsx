import { useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { OWNER_SCOPE, exportCsvUrl } from '@/api';
import { AdBanner } from '@/shared/components/AdBanner';
import { PageError, PageLoading } from '@/shared/components/PageStates';
import { StatRow } from '@/shared/components/StatRow';
import { ExportCsvButton } from '@/features/account/components/ExportCsvButton';
import { useAccount } from '@/features/account/hooks/useAccount';
import { AskVenture } from '@/features/assistant/AskVenture';
import { ComplianceItemModal } from '@/features/compliance/components/ComplianceItemModal';
import { ComplianceItemsTable } from '@/features/compliance/components/ComplianceItemsTable';
import { useComplianceItems } from '@/features/compliance/hooks/useComplianceItems';
import { useItemEditor } from '@/features/compliance/hooks/useItemEditor';
import { ActivityCard } from '@/features/insights/components/ActivityLog';
import { HealthSummaryCard } from '@/features/insights/components/HealthSummaryCard';
import { InsightsPanel } from '@/features/insights/components/InsightsPanel';
import { useBusinessInsights } from '@/features/insights/hooks/useBusinessInsights';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { useOwnerBusiness } from '../hooks/useOwnerBusiness';

const scope = OWNER_SCOPE;

/** A business owner's dashboard for their own business. */
export function PortalPage() {
  const owner = useOwnerBusiness();
  const itemsState = useComplianceItems(scope);
  const insights = useBusinessInsights(scope);
  const account = useAccount();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { reload: reloadOwner } = owner;
  const { reload: reloadItems } = itemsState;
  const { reload: reloadInsights } = insights;
  const reloadAll = useCallback(() => {
    reloadOwner();
    reloadItems();
    reloadInsights();
  }, [reloadOwner, reloadItems, reloadInsights]);

  const editor = useItemEditor(scope, reloadAll);

  const { business, health } = owner;
  const items = itemsState.items;
  const error = owner.error ?? itemsState.error;

  if (owner.notSetUp) return <Navigate to="/business-setup" />;
  if (error) return <PageError message={error} />;
  if (!business || items === null) return <PageLoading />;

  const count = (status: string) => items.filter((i) => i.status === status).length;

  return (
    <div className="container">
      <div className="eyebrow">Your business</div>
      <div className="section-head">
        <h1 style={{ fontSize: 26, marginBottom: 0 }}>{business.businessName}</h1>
      </div>
      <p className="form-note" style={{ marginBottom: 24 }}>
        {business.registrationId && <span className="num">{business.registrationId}</span>}
        {business.businessType && <span> · {business.businessType}</span>}
        {business.industry && <span> · {business.industry}</span>}
        {business.location && <span> · {business.location}</span>}
      </p>

      <StatRow
        stats={[
          { label: 'Total items', value: items.length },
          { label: 'Active', value: count('active'), tone: 'ok' },
          { label: 'Expiring soon', value: count('expiring_soon'), tone: 'warn' },
          { label: 'Expired', value: count('expired'), tone: 'danger' },
        ]}
      />

      <div className="layout">
        <div className="main-col">
          <div className="section-head">
            <h2 style={{ fontSize: 20 }}>Compliance</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <ExportCsvButton account={account} href={exportCsvUrl.owner} />
              <button className="btn btn-primary" onClick={() => editor.openCreate()}>
                Add compliance item
              </button>
            </div>
          </div>
          <ComplianceItemsTable
            scope={scope}
            items={items}
            emptyDescription="Add your licenses, registrations, or certificates with their expiry dates to start tracking them."
            onAdd={() => editor.openCreate()}
            onEdit={editor.openEdit}
            onDelete={editor.remove}
          />
          <ActivityCard entries={insights.activity} />
          <AdBanner account={account} slot={2} />
        </div>
        <aside className="rail">
          {health && <HealthSummaryCard title="Compliance Health" health={health} />}
          <AdBanner account={account} slot={0} />
          <div className="card card-pad">
            <div className="section-head">
              <h2 style={{ fontSize: 16 }}>Account</h2>
              <button className="btn-ghost btn" onClick={() => setShowPasswordForm((s) => !s)}>
                {showPasswordForm ? 'Cancel' : 'Change password'}
              </button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>
              Contact: {business.contactEmail || '—'} {business.contactPhone ? `· ${business.contactPhone}` : ''}
            </div>
            {showPasswordForm && <ChangePasswordForm onDone={() => setShowPasswordForm(false)} />}
          </div>
        </aside>
      </div>

        <InsightsPanel
          scope={scope}
          insights={insights}
          onAddCompliance={(name, category) => editor.openCreate({ name, category })}
        />

      {editor.state && (
        <ComplianceItemModal
          key={editor.state.item?.id ?? 'new'}
          scope={scope}
          item={editor.state.item}
          prefill={editor.state.prefill}
          onClose={editor.close}
          onSaved={editor.saved}
        />
      )}
      <AskVenture scope={scope} />
    </div>
  );
}
