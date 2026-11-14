import { useState } from 'react';
import type { SustainabilityInputs, SustainabilityRecommendation } from '@/types';
import { TextAreaField } from '@/shared/components/Field';
import { AdBanner } from '@/shared/components/AdBanner';
import { useAccount } from '@/features/account/hooks/useAccount';

const SECTORS = [
  { key: 'electricityNotes', id: 'electricity', icon: '⚡', label: 'Electricity & Power', placeholder: 'e.g. Monthly kWh usage, LED adoption, solar rooftop feasibility' },
  { key: 'transportNotes', id: 'transport', icon: '🚚', label: 'Transport & Logistics', placeholder: 'e.g. Delivery fleet size, average delivery routes, EV conversion' },
  { key: 'wasteNotes', id: 'waste', icon: '♻️', label: 'Waste Management', placeholder: 'e.g. Scrap disposal, biodegradable packaging, plastic reduction' },
  { key: 'waterNotes', id: 'water', icon: '💧', label: 'Water Conservation', placeholder: 'e.g. Water consumption source, rainwater harvesting, effluent treatment' },
] as const;

type NoteKey = (typeof SECTORS)[number]['key'];

interface Props {
  recommendations: SustainabilityRecommendation[];
  inputs: SustainabilityInputs | null;
  onSave: (inputs: Partial<SustainabilityInputs>) => Promise<void>;
}

export function SustainabilityView({ recommendations, inputs, onSave }: Props) {
  const account = useAccount();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState<Record<NoteKey, string>>({
    electricityNotes: inputs?.electricityNotes || '',
    transportNotes: inputs?.transportNotes || '',
    wasteNotes: inputs?.wasteNotes || '',
    waterNotes: inputs?.waterNotes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(notes);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const hasContext = !!inputs && SECTORS.some((s) => !!inputs[s.key]);

  return (
    <div className="tab-view-container">
      <div className="tab-hero-card tab-hero-green">
        <div className="tab-hero-copy">
          <div className="eyebrow" style={{ color: 'var(--brand)' }}>ESG &amp; Resource Efficiency</div>
          <h1>Sustainability &amp; Green Operations</h1>
          <p className="tab-hero-desc">
            Practical, cost-saving environmental initiatives tailored for Indian MSMEs: lower electricity overhead, optimize waste handling, and prepare for green supply chain audits.
          </p>
        </div>
        <div className="tab-hero-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? 'Cancel Editing' : hasContext ? '✏️ Update Business Context' : '➕ Add Business Context'}
          </button>
        </div>
      </div>

      <AdBanner account={account} slot={4} />

      {/* Business Context 4-Pillar Grid */}
      <div className="card card-pad" style={{ marginBottom: 28 }}>
        <div className="section-head">
          <div>
            <h2 style={{ fontSize: 18 }}>Operational Context</h2>
            <p className="form-note" style={{ marginTop: 2 }}>
              Your operational baseline shapes our custom cost-reduction and eco recommendations.
            </p>
          </div>
        </div>

        {editing ? (
          <div>
            <div className="sustainability-input-grid">
              {SECTORS.map((s) => (
                <div key={s.key} className="sustainability-input-cell">
                  <div className="sustainability-input-label">
                    <span className="sustainability-input-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  <TextAreaField
                    id={s.id}
                    label=""
                    rows={3}
                    placeholder={s.placeholder}
                    value={notes[s.key]}
                    onChange={(e) => setNotes((n) => ({ ...n, [s.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Context'}
              </button>
            </div>
          </div>
        ) : (
          <div className="sustainability-pillars-grid">
            {SECTORS.map((s) => {
              const val = inputs?.[s.key];
              return (
                <div key={s.key} className="sustainability-pillar-card">
                  <div className="pillar-header">
                    <span className="pillar-icon">{s.icon}</span>
                    <span className="pillar-title">{s.label}</span>
                  </div>
                  <div className="pillar-body">
                    {val ? (
                      <p className="pillar-content">{val}</p>
                    ) : (
                      <span className="pillar-empty">No details provided yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20 }}>Actionable Eco Recommendations</h2>
          <p className="form-note">Identified practical interventions with measurable operational savings.</p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="empty-state">
          <h3>No specific recommendations yet</h3>
          <p>Add context about your electricity, transport, or waste above to generate tailored green recommendations.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            Add Context
          </button>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-card">
              <div className="recommendation-card-top">
                <span className="recommendation-category-tag">{rec.category}</span>
                <span className="recommendation-impact-badge">Eco Action</span>
              </div>
              <p className="recommendation-desc" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                {rec.text}
              </p>
              <div className="recommendation-benefit-box">
                <span className="recommendation-benefit-title">Practical Impact:</span>
                <span className="recommendation-benefit-text">
                  Supports MSME compliance readiness, reduces utility overhead, and qualifies for green supply audits.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
