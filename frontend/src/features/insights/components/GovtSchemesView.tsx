import { useMemo, useState } from 'react';
import type { SchemeDiscoveryResult, SchemeMatch } from '@/types';
import { AdBanner } from '@/shared/components/AdBanner';
import { useAccount } from '@/features/account/hooks/useAccount';

interface Props {
  matches: SchemeMatch[];
  onDiscover: () => Promise<SchemeDiscoveryResult>;
}

export function GovtSchemesView({ matches, onDiscover }: Props) {
  const account = useAccount();
  const [discovery, setDiscovery] = useState<SchemeDiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  async function handleDiscover() {
    setLoading(true);
    try {
      setDiscovery(await onDiscover());
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['All', ...Array.from(set)];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.benefitSummary.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [matches, selectedCategory, search]);

  return (
    <div className="tab-view-container">
      <div className="tab-hero-card">
        <div className="tab-hero-copy">
          <div className="eyebrow">Financial &amp; Regulatory Concessions</div>
          <h1>Government Schemes &amp; Subsidies</h1>
          <p className="tab-hero-desc">
            Curated central and state government incentive programs, capital grants, and credit facilitation schemes matched to your industry profile.
          </p>
        </div>
        <div className="tab-hero-action">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDiscover}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Searching Live Schemes…
              </>
            ) : (
              '✨ Search Latest Schemes via AI'
            )}
          </button>
        </div>
      </div>

      <AdBanner account={account} slot={3} />

      <div className="scheme-filter-bar">
        <div className="scheme-search-box">
          <input
            type="text"
            className="input scheme-search-input"
            placeholder="Search schemes by keyword, benefit, or ministry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="scheme-category-pills">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat}
              className={`pill-btn${selectedCategory === cat ? ' active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {discovery && (
        <div className="scheme-discovery-card">
          <div className="scheme-discovery-header">
            <span className="scheme-ai-badge">AI Live Web Discovery</span>
            <span className="scheme-discovery-tag">Real-time Verified</span>
          </div>
          {discovery.unavailable ? (
            <p className="form-note">{discovery.reason}</p>
          ) : (
            <>
              <p className="scheme-discovery-summary">{discovery.summary}</p>
              {discovery.sources.length > 0 && (
                <div className="scheme-discovery-sources">
                  <span className="scheme-sources-label">Official Sources:</span>
                  {discovery.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="scheme-source-pill">
                      {s.title} ↗
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

      {filteredMatches.length === 0 ? (
        <div className="empty-state">
          <h3>No matching schemes found</h3>
          <p>
            {search || selectedCategory !== 'All'
              ? 'Try clearing your search query or switching categories.'
              : 'No matching scheme records based on your current business profile.'}
          </p>
          {(search || selectedCategory !== 'All') && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="schemes-grid">
          {filteredMatches.map((m) => (
            <div key={m.id} className="scheme-card">
              <div className="scheme-card-header">
                <div>
                  <h3 className="scheme-card-title">{m.name}</h3>
                  <div className="scheme-badges-row">
                    <span className="scheme-tag-category">{m.category}</span>
                    {m.needsMoreInfo ? (
                      <span className="scheme-tag-info">More info required</span>
                    ) : (
                      <span className="scheme-tag-match">✓ Profile Matched</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="scheme-benefit-box">
                <span className="scheme-benefit-label">Potential Benefit</span>
                <div className="scheme-benefit-text">{m.benefitSummary}</div>
              </div>

              <p className="scheme-card-desc">{m.description}</p>

              <div className="scheme-card-footer">
                <div className="scheme-source-meta">
                  Source: <a href={m.sourceUrl} target="_blank" rel="noreferrer">{m.sourceName} ↗</a>
                  <span className="scheme-checked-date">Verified {m.lastCheckedAt.slice(0, 10)}</span>
                </div>
                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Official Portal ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="form-note suggestions-disclaimer" style={{ marginTop: 32 }}>
        * Disclaimer: ComplyEasy aggregates and matches published guidelines from government agencies. Grant amounts, eligibility criteria, and fund availability are subject to official verification by respective administrative ministries.
      </p>
    </div>
  );
}

