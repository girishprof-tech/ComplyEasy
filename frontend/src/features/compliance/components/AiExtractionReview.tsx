import { Fragment } from 'react';
import type { AiExtraction } from '@/types';

export function AiExtractionReview({ extraction }: { extraction: AiExtraction }) {
  const rows: Array<[string, string | null]> = [
    ['Document Type', extraction.documentType],
    ['Business Name', extraction.businessName],
    ['Certificate Number', extraction.certificateNumber],
    ['Issuing Authority', extraction.issuingAuthority],
    ['Issue Date', extraction.issueDate],
    ['Expiry Date', extraction.expiryDate],
    ['Category', extraction.complianceCategory],
  ];

  return (
    <div className="ai-review-card">
      <div className="ai-review-head">
        <span>{extraction.demoMode ? 'Demo Extraction — Not Real Data' : 'AI Extracted — Verify Before Saving'}</span>
        {extraction.demoMode && <span className="demo-badge">Demo extraction</span>}
      </div>
      {extraction.demoMode && (
        <p className="form-note" style={{ marginBottom: 10 }}>
          No AI is configured, so these values are generated for demonstration only — they do not come from your
          certificate. Do not treat this as real extracted data.
        </p>
      )}
      <dl className="ai-review-grid">
        {rows.map(
          ([label, value]) =>
            value && (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </Fragment>
            )
        )}
        <dt>{extraction.demoMode ? 'Confidence (demo)' : 'Confidence'}</dt>
        <dd>{extraction.confidence}%</dd>
      </dl>
      {extraction.summary && <p className="ai-review-summary">{extraction.summary}</p>}
      <p className="form-note" style={{ marginTop: 8 }}>
        {extraction.demoMode
          ? 'These are placeholder values, not a real reading of your file. Edit every field below before saving.'
          : 'AI extracted — verify every field below before saving. This is a suggestion, not a confirmed record.'}
      </p>
    </div>
  );
}
