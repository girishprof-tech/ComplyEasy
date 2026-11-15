import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { clientScope, clientsApi, scopedApi } from '@/api';
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
import { useBusinessInsights } from '@/features/insights/hooks/useBusinessInsights';
import { BusinessSubNav, type BusinessTab } from '@/features/insights/components/BusinessSubNav';
import { GovtSchemesView } from '@/features/insights/components/GovtSchemesView';
import { SustainabilityView } from '@/features/insights/components/SustainabilityView';
import { AreasToReviewView } from '@/features/insights/components/AreasToReviewView';
import { ClientHeader } from '../components/ClientHeader';

/** An accountant's view of one client: profile, insights, compliance items, activity. */
export function ClientDetailPage() {
  const { id } = useParams();
  const clientId = Number(id);
  const scope = useMemo(() => clientScope(clientId), [clientId]);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as BusinessTab) || 'compliance';

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

  async function handleUploadLogo(logoData: string) {
    setActionError(null);
    try {
      await clientsApi.uploadLogo(clientId, logoData);
      loadClient();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not upload client logo.'));
    }
  }

  async function handleRemoveLogo() {
    setActionError(null);
    try {
      await clientsApi.removeLogo(clientId);
      loadClient();
    } catch (err) {
      setActionError(errorMessage(err, 'Could not remove client logo.'));
    }
  }

  function handleTabChange(nextTab: BusinessTab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', nextTab);
      return next;
    });
  }

  const error = actionError ?? clientError ?? itemsState.error;
  if (error && !client) return <PageError message={error} />;
  if (!client) return <PageLoading />;

  return (
    <div className="container">
      <div className="crumb">
        <Link to="/clients">Clients</Link> / {client.businessName}
      </div>

      <ClientHeader
        client={client}
        inviteUrl={inviteUrl}
        onInvite={handleInvite}
        onUploadLogo={handleUploadLogo}
        onRemoveLogo={handleRemoveLogo}
      />

      {error && <div className="form-error">{error}</div>}

      {/* Wide Ad Slot */}
      <AdBanner account={account} variant="wide" slot={0} />

      <BusinessSubNav
        activeTab={tab}
        onChangeTab={handleTabChange}
        counts={{
          complianceItems: itemsState.items?.length,
          reviewItems: insights.suggestions?.needingReviewCount,
          schemes: insights.schemes?.length,
        }}
      />

      <div className="layout">
        <div className="main-col">
          {tab === 'compliance' && (
            <>
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
              <AdBanner account={account} variant="trailer" />
            </>
          )}

          {tab === 'review' && (
            <>
              {insights.suggestions ? (
                <AreasToReviewView
                  data={insights.suggestions}
                  onAddCompliance={(name, category) => editor.openCreate({ name, category })}
                />
              ) : (
                <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--ink-soft)' }}>Analyzing license gaps and compliance checklists…</p>
                </div>
              )}
              <AdBanner account={account} variant="trailer" />
            </>
          )}

          {tab === 'schemes' && (
            <>
              {insights.schemes ? (
                <GovtSchemesView
                  matches={insights.schemes}
                  onDiscover={() => scopedApi(scope).discoverSchemes()}
                />
              ) : (
                <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--ink-soft)' }}>Matching central and state government schemes…</p>
                </div>
              )}
              <AdBanner account={account} variant="trailer" />
            </>
          )}

          {tab === 'sustainability' && (
            <>
              {insights.sustainability ? (
                <SustainabilityView
                  recommendations={insights.sustainability.recommendations}
                  inputs={insights.sustainability.userProvidedContext}
                  onSave={insights.saveSustainability}
                />
              ) : (
                <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--ink-soft)' }}>Loading sustainability and eco metrics…</p>
                </div>
              )}
              <AdBanner account={account} variant="trailer" />
            </>
          )}
        </div>

        <aside className="rail">
          {/* Sidebar Box Ad */}
          <AdBanner
            account={account}
            variant="square"
            slot={tab === 'compliance' ? 1 : tab === 'review' ? 2 : tab === 'schemes' ? 3 : 0}
          />
          {/* Sidebar Standard Ad */}
          <AdBanner account={account} variant="standard" slot={tab === 'compliance' ? 0 : 2} />
        </aside>
      </div>

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
