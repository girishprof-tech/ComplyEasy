import { useState } from 'react';
import type { SustainabilityInputs, SustainabilityRecommendation } from '@/types';
import { TextAreaField } from '@/shared/components/Field';

const FIELDS = [
  { key: 'electricityNotes', id: 'electricity', label: 'Electricity (optional)', placeholder: 'e.g. approximate monthly usage, current lighting type' },
  { key: 'transportNotes', id: 'transport', label: 'Transport / logistics (optional)', placeholder: 'e.g. delivery vehicles, typical routes' },
  { key: 'wasteNotes', id: 'waste', label: 'Waste (optional)', placeholder: 'e.g. current segregation practices' },
  { key: 'waterNotes', id: 'water', label: 'Water (optional)', placeholder: 'e.g. water source, known usage patterns' },
] as const;

type NoteKey = (typeof FIELDS)[number]['key'];

export function SustainabilityCard({
  recommendations,
  inputs,
  onSave,
}: {
  recommendations: SustainabilityRecommendation[];
  inputs: SustainabilityInputs | null;
  onSave: (inputs: Partial<SustainabilityInputs>) => Promise<void>;
}) {
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

  const hasSavedNotes = !!inputs && FIELDS.some((f) => inputs[f.key]);

  return (
    <div className="card card-pad" style={{ marginBottom: 24 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 16 }}>Sustainability Ideas</h2>
        <button type="button" className="btn-ghost btn" onClick={() => setEditing((e) => !e)}>
          {editing ? 'Cancel' : 'Add context'}
        </button>
      </div>

      {editing ? (
        <div>
          {FIELDS.map((f) => (
            <TextAreaField
              key={f.key}
              id={f.id}
              label={f.label}
              rows={2}
              placeholder={f.placeholder}
              value={notes[f.key]}
              onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))}
            />
          ))}
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      ) : (
        <>
          <div className="suggestions-list">
            {recommendations.map((r) => (
              <div key={r.id} className="suggestion-row" style={{ alignItems: 'center' }}>
                <div className="suggestion-main">
                  <span className="suggestion-category" style={{ marginBottom: 4, display: 'inline-block' }}>
                    {r.category}
                  </span>
                  <p className="suggestion-reason">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
          {hasSavedNotes && (
            <p className="form-note" style={{ marginTop: 12 }}>
              Your notes are saved and available to Ask Venture for more personalized suggestions.
            </p>
          )}
          <p className="form-note suggestions-disclaimer">
            Practical suggestions only — not mandatory requirements, and not a guaranteed emissions reduction.
          </p>
        </>
      )}
    </div>
  );
}
