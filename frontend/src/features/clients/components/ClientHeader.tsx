import type { Business } from '@/types';
import { LoginStatusBadge } from '@/shared/components/StatusBadge';

/** Client summary card with the invite / resend-invite action. */
export function ClientHeader({
  client,
  inviteUrl,
  onInvite,
}: {
  client: Business;
  inviteUrl: string | null;
  onInvite: () => void;
}) {
  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>{client.businessName}</h2>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
            {client.registrationId && <span className="num">{client.registrationId}</span>}
            {client.businessType && <span> · {client.businessType}</span>}
            {client.industry && <span> · {client.industry}</span>}
            {client.location && <span> · {client.location}</span>}
            {client.contactPerson && <span> · {client.contactPerson}</span>}
            {client.contactEmail && <span> · {client.contactEmail}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LoginStatusBadge status={client.loginStatus} />
          {client.loginStatus === 'not_invited' && (
            <button className="btn btn-secondary" onClick={onInvite}>
              Invite client
            </button>
          )}
          {client.loginStatus === 'invited' && (
            <button className="btn btn-secondary" onClick={onInvite}>
              Resend invite
            </button>
          )}
        </div>
      </div>
      {inviteUrl && (
        <div className="form-note" style={{ marginTop: 12, wordBreak: 'break-all' }}>
          Invite link ready — share it with your client:
          <br />
          <code style={{ fontFamily: 'var(--font-mono)' }}>{inviteUrl}</code>
        </div>
      )}
    </div>
  );
}
