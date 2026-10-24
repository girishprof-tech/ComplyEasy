import { useRef } from 'react';
import { Link } from 'react-router-dom';
import type { AccountSummary } from '@/types';

interface Ad {
  brand: string;
  tag: string;
  headline: string;
  copy: string;
  cta: string;
  color: string;
  tint: string;
}

// Entirely made-up sponsors, shown only to demonstrate how the Free plan would
// carry ads. Nothing here links anywhere or tracks anything.
const ADS: Ad[] = [
  {
    brand: 'Ledgerly',
    tag: 'Accounting software',
    headline: 'Close your books 3× faster',
    copy: 'Automated GST reconciliation built for growing MSMEs.',
    cta: 'Try free',
    color: '#1f6f5c',
    tint: '#e6f0ec',
  },
  {
    brand: 'FundPe Capital',
    tag: 'Business loans',
    headline: 'Collateral-free loans up to ₹50 lakh',
    copy: 'Decision in 48 hours. Terms and conditions apply.',
    cta: 'Check offer',
    color: '#b9711a',
    tint: '#fbf0dd',
  },
  {
    brand: 'ShieldOne',
    tag: 'Insurance',
    headline: 'Protect your stock & machinery',
    copy: 'Fire and burglary cover starting at ₹499 a month.',
    cta: 'Get a quote',
    color: '#2f5d9e',
    tint: '#e6edf8',
  },
  {
    brand: 'Packwise',
    tag: 'Packaging',
    headline: 'Eco-friendly packaging in 3 days',
    copy: 'Bulk pricing for small manufacturers and exporters.',
    cta: 'See catalogue',
    color: '#3c7f3c',
    tint: '#e8f3e6',
  },
  {
    brand: 'Haulr',
    tag: 'Logistics',
    headline: 'Same-day pickup across 200 cities',
    copy: 'Live tracking on every shipment, no contracts.',
    cta: 'Book a pickup',
    color: '#6b4bb0',
    tint: '#eee9f8',
  },
];

/**
 * A demo ad for the Free plan. Renders nothing for Pro users (or while the
 * plan is still loading, so ads never flash for paying users). `slot` offsets
 * which ad is shown so two banners on one page differ.
 */
export function AdBanner({ account, slot = 0 }: { account: AccountSummary | null; slot?: number }) {
  const seed = useRef(Math.floor(Math.random() * ADS.length));
  if (!account || account.tier !== 'free') return null;

  const ad = ADS[(seed.current + slot) % ADS.length];
  return (
    <aside
      className="ad-banner"
      aria-label="Advertisement"
      style={{ ['--ad-color' as string]: ad.color, ['--ad-tint' as string]: ad.tint }}
    >
      <div className="ad-logo" aria-hidden="true">
        {ad.brand[0]}
      </div>
      <div className="ad-body">
        <div className="ad-tag">
          {ad.brand} · {ad.tag}
        </div>
        <div className="ad-headline">{ad.headline}</div>
        <div className="ad-copy">{ad.copy}</div>
        <div className="ad-meta">
          <span className="ad-label">Ad</span> Demo placeholder ·{' '}
          <Link to="/plan">Remove ads with Pro</Link>
        </div>
      </div>
      <span className="ad-cta" aria-hidden="true">
        {ad.cta}
      </span>
    </aside>
  );
}
