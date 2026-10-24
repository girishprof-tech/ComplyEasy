import { Link } from 'react-router-dom';

const BOARD = [
  { client: 'Ravi Textiles', item: 'Trade License', when: '23 days overdue', tone: 'expired', run: 100 },
  { client: 'Anand Fabrication', item: 'GST Registration', when: 'Expires in 9 days', tone: 'expiring_soon', run: 88 },
  { client: 'Meera Exports', item: 'MSME Certificate', when: 'Expires in 141 days', tone: 'active', run: 34 },
  { client: 'Kaur Packaging', item: 'Fire NOC', when: 'Expires in 212 days', tone: 'active', run: 18 },
];

const LABEL: Record<string, string> = { expired: 'Expired', expiring_soon: 'Expiring soon', active: 'Active' };

export function LandingPage() {
  return (
    <>
      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div className="lp-copy">
            <h1>One ledger for every client's compliance deadlines.</h1>
            <p className="lp-lede">
              Every license, registration and renewal across your whole book of MSME clients, with whatever is
              expiring first at the top. No more opening client folders one at a time.
            </p>
            <div className="lp-ctas">
              <Link to="/register" className="btn lp-btn-light">
                Start your client book
              </Link>
              <Link to="/login" className="btn lp-btn-line">
                Log in
              </Link>
            </div>
            <p className="lp-fine">Free to start. No card required. Add your first client in minutes.</p>
          </div>

          <div className="lp-board" aria-label="Example of the cross-client ledger">
            <div className="lp-board-head">
              <strong>Needs attention</strong>
              <span>4 clients</span>
            </div>
            {BOARD.map((r) => (
              <div key={r.client} className="lp-row">
                <div className="lp-row-main">
                  <div className="lp-row-client">{r.client}</div>
                  <div className="lp-row-item">{r.item}</div>
                </div>
                <div className="lp-row-side">
                  <span className={`status-badge status-${r.tone}`}>{LABEL[r.tone]}</span>
                  <div className="lp-row-when">{r.when}</div>
                </div>
                <div className={`lp-runway ${r.tone}`} aria-hidden="true">
                  <i style={{ width: `${r.run}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <h2>Built for a portfolio, not a single business</h2>
        <div className="lp-bento">
          <article className="lp-tile lp-wide lp-tile-tint">
            <h3>Cross-client dashboard</h3>
            <p>Every expiring or expired item across all your clients in one ranked list, filterable by client.</p>
            <div className="lp-mini">
              <span className="status-badge status-expired">Expired</span>
              <span className="status-badge status-expiring_soon">Expiring soon</span>
              <span className="status-badge status-active">Active</span>
            </div>
          </article>
          <article className="lp-tile">
            <h3>Per-client tracking</h3>
            <p>Licenses, registrations and certificates with issue and expiry dates, so nothing slips.</p>
          </article>
          <article className="lp-tile">
            <h3>Invite clients in</h3>
            <p>Add a client yourself, then send a one-time invite link when they're ready for a login.</p>
            <div className="lp-invite">venture.app/invite/…7f3a</div>
          </article>
          <article className="lp-tile lp-wide lp-tile-deep">
            <h3>Your clients get visibility too</h3>
            <p>
              Once invited, a client gets a simple read-only login with just their own compliance status. It starts
              with you: clients don't sign up on their own.
            </p>
          </article>
        </div>
      </section>

      <section className="lp-cta">
        <h2>Start with one client. Add the rest when you're ready.</h2>
        <Link to="/register" className="btn btn-primary">
          Create your client book
        </Link>
      </section>

      <footer className="footer">
        <span>Venture — compliance tracking for accountants</span>
        <span>ComplyEasy AI</span>
      </footer>
    </>
  );
}
