import type { Suggestion, SuggestionsResponse } from '@/types';

const STATUS_CLASS: Record<Suggestion['status'], string> = {
  review_recommended: 'suggestion-status-review',
  documented: 'suggestion-status-documented',
  expiring_soon: 'suggestion-status-expiring',
  expired_document: 'suggestion-status-expired',
};

/**
 * The "Areas to Review" list. The only place system-suggested items appear —
 * they never enter the compliance item table, and [Add Compliance] always
 * routes into the normal item form rather than a second save path.
 */
export function SuggestionsCard({
  data,
  onAddCompliance,
}: {
  data: SuggestionsResponse;
  onAddCompliance: (suggestedName?: string, suggestedCategory?: string) => void;
}) {
  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 16 }}>Areas to Review</h2>
        {data.needingReviewCount > 0 && (
          <span className="login-status-badge invited">{data.needingReviewCount} to review</span>
        )}
      </div>

      <div className="suggestions-list">
        {data.suggestions.map((s) => (
          <div key={s.id} className="suggestion-row">
            <div className="suggestion-main">
              <div className="suggestion-name-row">
                <span className="suggestion-name">{s.name}</span>
                <span className="suggestion-category">{s.category}</span>
                <span className={`suggestion-status ${STATUS_CLASS[s.status]}`}>{s.statusLabel}</span>
              </div>
              <p className="suggestion-reason">{s.reason}</p>
            </div>
            {s.status === 'review_recommended' && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flexShrink: 0 }}
                onClick={() => onAddCompliance(s.name, s.category)}
              >
                Add Compliance
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="form-note suggestions-disclaimer">{data.disclaimer}</p>
    </div>
  );
}
