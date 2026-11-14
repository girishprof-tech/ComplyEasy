import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AccountSummary } from '@/types';
import { useAccount } from '@/features/account/hooks/useAccount';
import { useDemoAds } from '@/shared/hooks/useDemoAds';
import { GtaPreorderModal } from './GtaPreorderModal';

interface Ad {
  brand: string;
  tag: string;
  headline: string;
  copy: string;
  cta: string;
  color: string;
  tint: string;
  isNeon?: boolean;
  neonBadge?: string;
  isGtaUniverse?: boolean;
}

const ADS: Ad[] = [
  {
    brand: 'Ammu-Nation',
    tag: 'Vice City Commercial Outpost',
    headline: 'Protecting Leonida Business Assets Since 1986',
    copy: 'Special discount on perimeter surveillance, store security safes, and heavy tactical gear for registered business owners.',
    cta: 'View Arsenal',
    color: '#ef4444',
    tint: '#fef2f2',
    isNeon: true,
    neonBadge: 'AMMU-NATION',
    isGtaUniverse: true,
  },
  {
    brand: 'VC Exotic',
    tag: 'Ocean Drive Rentals · Vice City',
    headline: 'Supercars, Speedboats & Choppers. No Questions Asked.',
    copy: 'Cruise the neon strip in style. 50% discount for commercial trade syndicates. Optional unmarked getaway coverage included.',
    cta: 'Reserve Ride',
    color: '#00c8e6',
    tint: '#eefcff',
    isNeon: true,
    neonBadge: 'OCEAN DRIVE',
    isGtaUniverse: true,
  },
  {
    brand: 'Malibu Club',
    tag: 'Vice Point Nightlife',
    headline: 'Neon Synthwave, Ocean Breeze & VIP Lounges',
    copy: 'Reopened for the 2026 season. Reserve your beachfront VIP booth with retro synth cocktails and live Vice City DJs.',
    cta: 'Book VIP Booth',
    color: '#a855f7',
    tint: '#faf5ff',
    isNeon: true,
    neonBadge: 'MALIBU VIP',
    isGtaUniverse: true,
  },
  {
    brand: 'Weazel News',
    tag: 'Vice City Channel 6',
    headline: 'High-Speed Chases & Everglades Chaos 24/7',
    copy: 'Breaking live feeds of Vice City police chases and bizarre Leonida Man sightings delivered straight to your terminal.',
    cta: 'Watch Stream',
    color: '#f59e0b',
    tint: '#fffbeb',
    isNeon: true,
    neonBadge: 'WEAZEL NEWS',
    isGtaUniverse: true,
  },
  {
    brand: 'Ledgerly',
    tag: 'Accounting software',
    headline: 'Close your books 3× faster',
    copy: 'Automated GST reconciliation and compliance logging built for growing Indian MSMEs.',
    cta: 'Try free',
    color: '#1f6f5c',
    tint: '#e6f0ec',
  },
];

  interface Props {
    account?: AccountSummary | null;
    slot?: number;
    variant?: 'wide' | 'square' | 'standard' | 'trailer' | 'ticker';
    className?: string;
  }

  export function AdBanner({ account: propAccount, slot = 0, variant = 'standard', className = '' }: Props) {
    const internalAccount = useAccount();
    const account = propAccount !== undefined ? propAccount : internalAccount;
    const seed = useRef(Math.floor(Math.random() * ADS.length));
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'preorder' | 'trailer' | 'gallery'>('preorder');

    // If user upgraded to Pro, do not display ads
    if (account && account.tier === 'pro') return null;

    function openPreorder() {
      setModalTab('preorder');
      setModalOpen(true);
    }

    function openTrailer() {
      setModalTab('trailer');
      setModalOpen(true);
    }

    // 1. Sleek Top-Bar Ticker Ribbon
    if (variant === 'ticker') {
      return (
        <>
          <div className={`gta-ticker-bar ${className}`}>
            <div className="gta-ticker-content">
              <span className="rstar-badge">★ ROCKSTAR</span>
              <span className="gta-ticker-accent">🌴 GRAND THEFT AUTO VI</span>
              <span className="gta-ticker-text">Vice City &amp; Leonida · Coming Fall 2026 · Pre-Orders Now Live</span>
              <button type="button" className="gta-ticker-btn" onClick={openPreorder}>
                Pre-Order Now →
              </button>
              <span className="gta-ticker-trailer" onClick={openTrailer}>
                ▶ Watch 4K Trailer
              </span>
              <span className="gta-ticker-pro">
                (Ad · <Link to="/plan">Remove with Pro</Link>)
              </span>
            </div>
          </div>
          <GtaPreorderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
        </>
      );
    }

    // 2. Cinematic Wide Billboard Banner (Hero marketing)
    if (variant === 'wide') {
      const bgImage = slot % 2 === 0 ? '/ads/gta6-official-rooftop.jpg' : '/ads/gta6-official-hero.jpg';
      return (
        <>
          <aside
            className={`gta-banner-wide ${className}`}
            style={{ backgroundImage: `url('${bgImage}')` }}
            aria-label="Grand Theft Auto VI Official Advertisement"
          >
            <div className="gta-wide-overlay">
              <div className="gta-wide-content">
                <div className="gta-header-badge-row">
                  <span className="rstar-badge">★ ROCKSTAR GAMES</span>
                  <span className="gta-esrb-badge">M 17+</span>
                  <span className="gta-neon-tagline">Vice City · Fall 2026</span>
                </div>

                <div className="gta-official-logos-row">
                  <img src="/ads/gta-logo.png" alt="Grand Theft Auto" className="gta-official-text-logo" />
                  <img src="/ads/gta6-logo-vi.png" alt="VI" className="gta-official-vi-logo" />
                </div>

                <p className="gta-wide-subtitle">
                  Welcome back to the sun-soaked neon streets of Vice City. Pre-order now to unlock the Leonida Criminal Enterprise Starter Pack &amp; $1,000,000 in-game currency.
                </p>

                <div className="gta-platforms-row">
                  <span>PlayStation 5</span>
                  <span>·</span>
                  <span>Xbox Series X|S</span>
                  <span>·</span>
                  <span>PC</span>
                </div>
              </div>

              <div className="gta-wide-cta-box">
                <button type="button" className="gta-preorder-btn" onClick={openPreorder}>
                  PRE-ORDER NOW →
                </button>
                <button type="button" className="gta-trailer-btn-secondary" onClick={openTrailer}>
                  ▶ Watch 4K Trailer
                </button>
                <div className="gta-ad-disclaimer">
                  <span>Sponsored Ad · </span>
                  <Link to="/plan">Remove ads with Pro</Link>
                </div>
              </div>
            </div>
          </aside>
          <GtaPreorderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
        </>
      );
    }

    // 3. Official Box Art / Cover Skyscraper for Sidebar Rail
    if (variant === 'square') {
      const boxart = slot % 2 === 0 ? '/ads/gta6-boxart.jpg' : '/ads/gta6-ultimate-edition.jpg';
      return (
        <>
          <aside
            className={`gta-banner-square ${className}`}
            style={{ backgroundImage: `url('${boxart}')` }}
            aria-label="Grand Theft Auto VI Official Cover Art"
          >
            <div className="gta-square-overlay">
              <div className="gta-header-badge-row">
                <span className="rstar-badge">★ ROCKSTAR</span>
                <span className="gta-esrb-badge">M 17+</span>
                <span className="gta-neon-tagline">FALL 2026</span>
              </div>

              <div className="gta-square-logo-area">
                <img src="/ads/gta6-logo-vi.png" alt="GTA VI" className="gta-square-vi-logo" />
              </div>

              <h3 className="gta-square-title">
                GRAND THEFT AUTO <span>VI</span>
              </h3>
              <p className="gta-square-desc">
                Jason &amp; Lucia. Trust is everything when survival is the only rule.
              </p>
              <div className="gta-bonus-chip">
                🎁 Bonus: Outfits + $500,000 GTA$
              </div>
              <button
                type="button"
                className="gta-preorder-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 13 }}
                onClick={openPreorder}
              >
                PRE-ORDER NOW
              </button>
              <button
                type="button"
                className="gta-trailer-btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: 12 }}
                onClick={openTrailer}
              >
                ▶ Official Trailer
              </button>
              <div className="gta-ad-disclaimer" style={{ justifyContent: 'center' }}>
                <span>Sponsored Ad · </span>
                <Link to="/plan">Remove with Pro</Link>
              </div>
            </div>
          </aside>
          <GtaPreorderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
        </>
      );
    }

    // 4. Interactive Trailer Banner
    if (variant === 'trailer') {
      return (
        <>
          <aside
            className={`gta-banner-trailer ${className}`}
            style={{ backgroundImage: `url('/ads/gta6-trailer-art.jpg')` }}
            aria-label="Watch Grand Theft Auto VI Trailer"
            onClick={openTrailer}
          >
            <div className="gta-trailer-overlay">
              <div className="gta-trailer-play-circle">
                <span className="gta-trailer-play-icon">▶</span>
              </div>
              <div className="gta-trailer-copy">
                <div className="gta-header-badge-row">
                  <span className="rstar-badge">★ ROCKSTAR GAMES</span>
                  <span className="gta-neon-tagline">OFFICIAL REVEAL TRAILER</span>
                </div>
                <h3 className="gta-trailer-title">WATCH GRAND THEFT AUTO VI IN 4K</h3>
                <p className="gta-trailer-sub">Over 220,000,000 views · Tap to play trailer in high-definition</p>
              </div>
              <button type="button" className="gta-trailer-action-btn" onClick={(e) => { e.stopPropagation(); openPreorder(); }}>
                Pre-Order Now
              </button>
            </div>
          </aside>
          <GtaPreorderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
        </>
      );
    }

    // 5. In-Feed Standard Sponsored Card
    const ad = ADS[(seed.current + slot) % ADS.length];
    return (
    <>
      <aside
        className={`ad-banner${ad.isNeon ? ' ad-neon' : ''} ${className}`}
        aria-label="Advertisement"
        style={{ ['--ad-color' as string]: ad.color, ['--ad-tint' as string]: ad.tint }}
      >
        <div className="ad-logo" aria-hidden="true">
          {ad.brand.slice(0, 2).toUpperCase()}
        </div>
        <div className="ad-body">
          <div className="ad-tag-row">
            <span className="ad-tag">{ad.brand} · {ad.tag}</span>
            {ad.neonBadge && <span className="ad-neon-pill">{ad.neonBadge}</span>}
          </div>
          <div className="ad-headline">{ad.headline}</div>
          <div className="ad-copy">{ad.copy}</div>
          <div className="ad-meta">
            <span className="ad-label">Sponsored</span> Demo Partner Ad ·{' '}
            <Link to="/plan">Remove ads with Pro</Link>
          </div>
        </div>
        <button
          type="button"
          className="ad-cta"
          onClick={() => {
            if (ad.isGtaUniverse) {
              openPreorder();
            } else {
              setModalTab('preorder');
              setModalOpen(true);
            }
          }}
        >
          {ad.cta}
        </button>
      </aside>
      <GtaPreorderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialTab={modalTab} />
    </>
  );
  }
