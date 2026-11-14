import type { Suggestion, SuggestionsResponse } from '@/types';
import { AdBanner } from '@/shared/components/AdBanner';
import { useAccount } from '@/features/account/hooks/useAccount';

const STATUS_CLASS: Record<Suggestion['status'], string> = {
  review_recommended: 'suggestion-status-review',
  documented: 'suggestion-status-documented',
  expiring_soon: 'suggestion-status-expiring',
  expired_document: 'suggestion-status-expired',
};

interface Props {
  data: SuggestionsResponse;
  onAddCompliance: (suggestedName?: string, suggestedCategory?: string) => void;
}

export function AreasToReviewView({ data, onAddCompliance }: Props) {
  const account = useAccount();

  return (
    <div className="tab-view-container">
      <div className="tab-hero-card tab-hero-amber">
        <div className="tab-hero-copy">
          <div className="eyebrow" style={{ color: '#b45309' }}>Proactive Gap Analysis</div>
          <h1>Areas to Review &amp; Compliance Audit</h1>
          <p className="tab-hero-desc">
            Commonly required licenses, permits, and registrations for Indian businesses in your sector that are currently missing from your active ledger.
          </p>
        </div>
        <div className="tab-hero-action">
          {data.needingReviewCount > 0 && (
            <div className="review-badge-counter">
              <span className="review-counter-number">{data.needingReviewCount}</span>
              <span className="review-counter-text">items need review</span>
            </div>
          )}
        </div>
      </div>

      <AdBanner account={account} slot={2} />

      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20 }}>Regulatory Health Checklist</h2>
          <p className="form-note">
            Review these items and click <strong>Add Compliance</strong> to start tracking expiration deadlines.
          </p>
        </div>
      </div>

      {data.suggestions.length === 0 ? (
        <div className="empty-state">
          <h3>All recommended areas are documented!</h3>
          <p>No missing compliance items detected for your current industry profile.</p>
        </div>
      ) : (
        <div className="review-cards-list">
          {data.suggestions.map((s) => (
            <div key={s.id} className="review-audit-card">
              <div className="review-card-left">
                <div className="review-card-header-row">
                  <h3 className="review-card-name">{s.name}</h3>
                  <span className="suggestion-category">{s.category}</span>
                  <span className={`suggestion-status ${STATUS_CLASS[s.status]}`}>{s.statusLabel}</span>
                </div>
                <div className="review-reason-box">
                  <span className="review-reason-icon">ℹ️</span>
                  <p className="review-card-reason">{s.reason}</p>
                </div>
              </div>

              <div className="review-card-right">
                {s.status === 'review_recommended' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onAddCompliance(s.name, s.category)}
                  >
                    + Add to Compliance
                  </button>
                )}
                {s.status === 'documented' && (
                  <span className="documented-check-badge">✓ Tracked in Ledger</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="form-note suggestions-disclaimer" style={{ marginTop: 24 }}>
        {data.disclaimer}
      </p>
    </div>
  );
}

