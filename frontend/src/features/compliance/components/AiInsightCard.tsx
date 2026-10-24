import type { AiInsight } from '@/types';

export function AiInsightCard({ insight }: { insight: AiInsight }) {
  return (
    <div className={`ai-insight ai-insight-${insight.level}`}>
      <div className="ai-insight-label">AI Insight</div>
      <div className="ai-insight-headline">{insight.headline}</div>
      <div className="ai-insight-body">{insight.body}</div>
    </div>
  );
}
