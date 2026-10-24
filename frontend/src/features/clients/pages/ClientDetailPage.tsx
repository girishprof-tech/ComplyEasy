import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clientScope, clientsApi } from '@/api';
import type { Business } from '@/types';
import { AdBanner } from '@/shared/components/AdBanner';
import { useAccount } from '@/features/account/hooks/useAccount';
import { PageError, PageLoading } from '@/shared/components/PageStates';
import { errorMessage } from '@/shared/lib/errors';
import { AskVenture } from '@/features/assistant/AskVenture';
import { ComplianceItemModal } from '@/features/compliance/components/ComplianceItemModal';
import { ComplianceItemsTable } from '@/features/compliance/components/ComplianceItemsTable';
import { useComplianceItems } from '@/features/compliance/hooks/useComplianceItems';
import { useItemEditor } from '@/features/compliance/hooks/useItemEditor';
import { ActivityCard } from '@/features/insights/components/ActivityLog';
import { InsightsPanel } from '@/features/insights/components/InsightsPanel';
import { useBusinessInsights } from '@/features/insights/hooks/useBusinessInsights';
import { ClientHeader } from '../components/ClientHeader';

/** An accountant's view of one client: profile, insights, compliance items, activity. */
export function ClientDetailPage() {
  const { id } = useParams();
  const clientId = Number(id);
  const scope = useMemo(() => clientScope(clientId), [clientId]);

  const [client, setClient] = useState<Business | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const account = useAccount();
  const itemsState = useComplianceItems(scope);
  const insights = useBusinessInsights(scope);

  const loadClient = useCallback(() => {
    clientsApi
      .get(clientId)
      .then(setClient)
      .catch((e: Error) => setClientError(e.message));
  }, [clientId]);

  useEffect(loadClient, [loadClient]);

  const { reload: reloadItems } = itemsState;
  const { reload: reloadInsights } = insights;
  const reloadAll = useCallback(() => {
    loadClient();
    reloadItems();
    reloadInsights();
  }, [loadClient, reloadItems, reloadInsights]);

  const editor = useItemEditor(scope, reloadAll);

  async function handleInvite() {
    setActionError(null);
    try {
      const res = await clientsApi.invite(clientId);
      setInviteUrl(`${window.location.origin}${res.inviteUrl}`);
      loadClient();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not create invite.'));
    }
  }

  const error = actionError ?? clientError ?? itemsState.error;
  if (error && !client) return <PageError message={error} />;
  if (!client) return <PageLoading />;

  return (
    <div className="container">
      <div className="crumb">
        <Link to="/clients">Clients</Link> / {client.businessName}
      </div>

      <ClientHeader client={client} inviteUrl={inviteUrl} onInvite={handleInvite} />

      {error && <div className="form-error">{error}</div>}

      <div className="layout">
        <div className="main-col">
          <div className="section-head">
            <h2 style={{ fontSize: 20 }}>Compliance items</h2>
            <button className="btn btn-primary" onClick={() => editor.openCreate()}>
              Add item
            </button>
          </div>
          <ComplianceItemsTable
            scope={scope}
            items={itemsState.items}
            showIssued
            emptyDescription="Add this client's licenses, registrations, or certificates with their expiry dates to start tracking them."
            onAdd={() => editor.openCreate()}
            onEdit={editor.openEdit}
            onDelete={editor.remove}
          />
          <ActivityCard entries={insights.activity} />
        </div>
        <aside className="rail">
          <AdBanner account={account} slot={1} />
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
