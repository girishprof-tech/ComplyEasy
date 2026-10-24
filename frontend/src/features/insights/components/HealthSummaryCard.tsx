import type { HealthSummary } from '@/types';

export function HealthSummaryCard({ title, health }: { title: string; health: HealthSummary }) {
  return (
    <div className="card card-pad health-card">
      <div className="section-head">
        <h2 style={{ fontSize: 16 }}>{title}</h2>
        <div className="health-score">
          <span className="health-score-value">{health.score}</span>
          <span className="health-score-max">/100</span>
        </div>
      </div>
      <div className="ai-review-head" style={{ marginBottom: 6 }}>
        <span>AI Summary</span>
        {health.demoMode && <span className="demo-badge">Demo AI Mode</span>}
      </div>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 10px' }}>{health.summary}</p>
      {health.highestPriority && (
        <p style={{ fontSize: 14, margin: 0 }}>
          <strong>Highest priority:</strong> {health.highestPriority}
        </p>
      )}
    </div>
  );
}
