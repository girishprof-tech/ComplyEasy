import { useMemo } from 'react';
import { scopedApi, type BusinessScope } from '@/api';
import type { BusinessInsights } from '../hooks/useBusinessInsights';
import { SchemesCard } from './SchemesCard';
import { SuggestionsCard } from './SuggestionsCard';
import { SustainabilityCard } from './SustainabilityCard';

/** Areas to Review, Schemes and Sustainability: three separate columns, each with its own accent. */
export function InsightsPanel({
  scope,
  insights,
  onAddCompliance,
}: {
  scope: BusinessScope;
  insights: BusinessInsights;
  onAddCompliance: (suggestedName?: string, suggestedCategory?: string) => void;
}) {
  const api = useMemo(() => scopedApi(scope), [scope]);
  const { suggestions, schemes, sustainability, saveSustainability } = insights;

  return (
    <section className="insights-band" aria-label="Insights">
      <div className="section-head">
        <h2>Insights</h2>
      </div>
      <div className="insights-grid">
        {suggestions && (
          <div className="insight-col insight-review">
            <SuggestionsCard data={suggestions} onAddCompliance={onAddCompliance} />
          </div>
        )}
        {schemes && (
          <div className="insight-col insight-schemes">
            <SchemesCard matches={schemes} onDiscover={() => api.discoverSchemes()} />
          </div>
        )}
        {sustainability && (
          <div className="insight-col insight-green">
            <SustainabilityCard
              recommendations={sustainability.recommendations}
              inputs={sustainability.userProvidedContext}
              onSave={saveSustainability}
            />
          </div>
        )}
      </div>
    </section>
  );
}
