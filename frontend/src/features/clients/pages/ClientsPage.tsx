import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '@/api';
import type { Business } from '@/types';
import { LoginStatusBadge } from '@/shared/components/StatusBadge';
import { AddClientModal } from '../components/AddClientModal';

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Business[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    clientsApi
      .list()
      .then(setClients)
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="container">
      <div className="section-head">
        <h2 style={{ fontSize: 26 }}>Clients</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Add client
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card">
        {clients === null ? (
          <div className="card-pad">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <h3>No clients yet</h3>
            <p>
              Add your first client to start tracking their licenses and certificates. You can invite them to their
              own login any time after.
            </p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Add your first client
            </button>
          </div>
        ) : (
          <table className="ledger" style={{ padding: '4px 0' }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>Business</th>
                <th>Registration ID</th>
                <th>Contact</th>
                <th style={{ paddingRight: 20 }}>Login</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td style={{ paddingLeft: 20, fontWeight: 600 }}>{c.businessName}</td>
                  <td className="num">{c.registrationId || '—'}</td>
                  <td>{c.contactPerson || c.contactEmail || '—'}</td>
                  <td style={{ paddingRight: 20 }}>
                    <LoginStatusBadge status={c.loginStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <AddClientModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
