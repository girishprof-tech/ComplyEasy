import { useState } from 'react';
import type { SchemeDiscoveryResult, SchemeMatch } from '@/types';

/**
 * Two deliberately distinct sections: verified matches (curated records,
 * always source- and date-attributed) and discovered results (a live web
 * search, fetched only on request and never merged into the verified list).
 */
export function SchemesCard({
  matches,
  onDiscover,
}: {
  matches: SchemeMatch[];
  onDiscover: () => Promise<SchemeDiscoveryResult>;
}) {
  const [discovery, setDiscovery] = useState<SchemeDiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDiscover() {
    setLoading(true);
    try {
      setDiscovery(await onDiscover());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 16 }}>Potential Schemes &amp; Subsidies</h2>
      </div>

      {matches.length === 0 ? (
        <p className="form-note">No matching scheme records based on your current profile.</p>
      ) : (
        <div className="scheme-list">
          {matches.map((m) => (
            <div key={m.id} className="scheme-row">
              <div className="scheme-name-row">
                <span className="scheme-name">{m.name}</span>
                <span className="suggestion-category">{m.category}</span>
                {m.needsMoreInfo && <span className="login-status-badge invited">More info needed</span>}
              </div>
              <p className="suggestion-reason">{m.description}</p>
              <p className="scheme-benefit">
                <strong>Potential benefit:</strong> {m.benefitSummary}
              </p>
              <div className="scheme-source">
                Source:{' '}
                <a href={m.sourceUrl} target="_blank" rel="noreferrer">
                  {m.sourceName}
                </a>{' '}
                · checked {m.lastCheckedAt.slice(0, 10)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="scheme-discover-row">
        <button type="button" className="btn btn-secondary" onClick={handleDiscover} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> Searching…
            </>
          ) : (
            'Search for more current schemes'
          )}
        </button>
      </div>

      {discovery && (
        <div className="scheme-discovery-result">
          {discovery.unavailable ? (
            <p className="form-note">{discovery.reason}</p>
          ) : (
            <>
              <div className="ai-review-head" style={{ marginBottom: 8 }}>
                <span>Discovered via web search</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{discovery.summary}</p>
              {discovery.sources.length > 0 && (
                <div className="ask-venture-sources" style={{ marginTop: 8 }}>
                  {discovery.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer">
                      {s.title}
                    </a>
                  ))}
                </div>
              )}
              <p className="form-note" style={{ marginTop: 10 }}>
                {discovery.disclaimer}
              </p>
            </>
          )}
        </div>
      )}

      <p className="form-note suggestions-disclaimer">
        Venture does not guarantee subsidy eligibility. Confirm benefit amounts and eligibility with the official
        scheme source before applying.
      </p>
    </div>
  );
}
