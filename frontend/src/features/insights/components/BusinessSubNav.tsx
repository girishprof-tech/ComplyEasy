export type BusinessTab = 'compliance' | 'review' | 'schemes' | 'sustainability';

interface Props {
  activeTab: BusinessTab;
  onChangeTab: (tab: BusinessTab) => void;
  counts?: {
    complianceItems?: number;
    reviewItems?: number;
    schemes?: number;
  };
}

export function BusinessSubNav({ activeTab, onChangeTab, counts }: Props) {
  return (
    <nav className="business-subnav" aria-label="Business sections">
      <button
        type="button"
        className={`subnav-tab${activeTab === 'compliance' ? ' active' : ''}`}
        onClick={() => onChangeTab('compliance')}
      >
        <span className="subnav-tab-icon">📋</span>
        <span className="subnav-tab-label">Compliance Ledger</span>
        {counts?.complianceItems !== undefined && (
          <span className="subnav-badge">{counts.complianceItems}</span>
        )}
      </button>

      <button
        type="button"
        className={`subnav-tab${activeTab === 'review' ? ' active' : ''}`}
        onClick={() => onChangeTab('review')}
      >
        <span className="subnav-tab-icon">🔍</span>
        <span className="subnav-tab-label">Areas to Review</span>
        {!!counts?.reviewItems && counts.reviewItems > 0 && (
          <span className="subnav-badge subnav-badge-warn">{counts.reviewItems}</span>
        )}
      </button>

      <button
        type="button"
        className={`subnav-tab${activeTab === 'schemes' ? ' active' : ''}`}
        onClick={() => onChangeTab('schemes')}
      >
        <span className="subnav-tab-icon">🏛️</span>
        <span className="subnav-tab-label">Govt Schemes &amp; Subsidies</span>
        {counts?.schemes !== undefined && (
          <span className="subnav-badge">{counts.schemes}</span>
        )}
      </button>

      <button
        type="button"
        className={`subnav-tab${activeTab === 'sustainability' ? ' active' : ''}`}
        onClick={() => onChangeTab('sustainability')}
      >
        <span className="subnav-tab-icon">🌱</span>
        <span className="subnav-tab-label">Sustainability &amp; ESG</span>
      </button>
    </nav>
  );
}

