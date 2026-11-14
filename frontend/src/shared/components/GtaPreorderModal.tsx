import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'preorder' | 'trailer' | 'gallery';
}

type Edition = 'standard' | 'ultimate' | 'collector';
type Platform = 'ps5' | 'xbox' | 'pc';

const EDITIONS = [
  {
    id: 'standard' as Edition,
    name: 'Standard Edition',
    price: '$69.99',
    badge: 'Popular',
    image: '/ads/gta6-boxart.jpg',
    features: [
      'Full Grand Theft Auto VI Story Mode',
      'Leonida & Vice City Map Day-One Access',
      'Exclusive Pre-order Bonus: The Outlaw Pack',
      '$500,000 In-Game Cash for GTA Online',
    ],
  },
  {
    id: 'ultimate' as Edition,
    name: 'Ultimate Vice City Edition',
    price: '$99.99',
    badge: 'Best Value',
    image: '/ads/gta6-ultimate-edition.jpg',
    features: [
      'Everything in Standard Edition',
      '3-Day Early Access before Global Launch',
      'Grotti Cheetah Classic Sports Car & Garage',
      'Vice City Neon Outfits & Weapon Skins Pack',
      '$2,000,000 In-Game Cash for GTA Online',
      'Exclusive Rockstar Games Digital Soundtrack',
    ],
  },
  {
    id: 'collector' as Edition,
    name: "Collector's Syndicate Box",
    price: '$149.99',
    badge: 'Limited',
    image: '/ads/gta6-poster.jpg',
    features: [
      'Everything in Ultimate Edition',
      'Embossed Steelbook Game Case & Physical Map',
      'Vice City Police Department Gold Badge Prop',
      'Leonida Highway Retro License Plate Replica',
      'VIP Access to First 3 Story DLC Expansions',
    ],
  },
];

const PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'ps5', label: 'PlayStation 5', icon: '🎮' },
  { id: 'xbox', label: 'Xbox Series X|S', icon: '🟢' },
  { id: 'pc', label: 'PC / Rockstar Launcher', icon: '💻' },
];

export function GtaPreorderModal({ isOpen, onClose, initialTab = 'preorder' }: Props) {
  const [tab, setTab] = useState<'preorder' | 'trailer' | 'gallery'>(initialTab);
  const [selectedEdition, setSelectedEdition] = useState<Edition>('ultimate');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('ps5');
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setConfirmed(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTab]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentEdition = EDITIONS.find((e) => e.id === selectedEdition) || EDITIONS[1];

  function handleConfirm() {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    setOrderId(`VC-2026-${randomCode}`);
    setConfirmed(true);
  }

  return createPortal(
    <div className="gta-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Grand Theft Auto VI Official Pre-order">
      <div className="gta-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="gta-modal-header">
          <div className="gta-modal-brand">
            <span className="rstar-badge">★ ROCKSTAR GAMES</span>
            <span className="gta-neon-tagline">Vice City · Leonida</span>
          </div>
          <button type="button" className="gta-modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Hero Top Bar */}
        <div className="gta-modal-hero">
          <div className="gta-modal-hero-content">
            <div className="gta-modal-logo-wrap">
              <img src="/ads/gta-logo.png" alt="Grand Theft Auto" className="gta-modal-logo-text" />
              <img src="/ads/gta6-logo-vi.png" alt="VI" className="gta-modal-logo-vi" />
            </div>
            <p className="gta-modal-hero-sub">
              Pre-order Grand Theft Auto VI now. Set in the neon-soaked state of Leonida, experience Jason and Lucia’s descent into Vice City’s criminal underground.
            </p>
            <div className="gta-modal-tabs">
              <button
                type="button"
                className={`gta-modal-tab-btn${tab === 'preorder' ? ' active' : ''}`}
                onClick={() => setTab('preorder')}
              >
                ⚡ Pre-Order Editions
              </button>
              <button
                type="button"
                className={`gta-modal-tab-btn${tab === 'trailer' ? ' active' : ''}`}
                onClick={() => setTab('trailer')}
              >
                🎬 Official Trailer (4K)
              </button>
              <button
                type="button"
                className={`gta-modal-tab-btn${tab === 'gallery' ? ' active' : ''}`}
                onClick={() => setTab('gallery')}
              >
                📸 Leonida Media Gallery
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Pre-order */}
        {tab === 'preorder' && (
          <div className="gta-modal-body">
            {confirmed ? (
              <div className="gta-confirmed-box">
                <div className="gta-confirmed-icon">🌴</div>
                <h2 className="gta-confirmed-title">WELCOME TO VICE CITY!</h2>
                <div className="gta-confirmed-badge">RESERVATION CONFIRMED</div>
                <p className="gta-confirmed-sub">
                  Your pre-order for <strong>{currentEdition.name}</strong> on{' '}
                  <strong>{PLATFORMS.find((p) => p.id === selectedPlatform)?.label}</strong> has been secured with Rockstar Games.
                </p>
                <div className="gta-confirmed-order-id">
                  Order ID: <span>#{orderId}</span>
                </div>
                <p className="gta-confirmed-note">
                  Billing will occur upon launch in Fall 2026. A confirmation receipt has been simulated for this demo account.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
                  <button type="button" className="btn btn-primary" onClick={() => setConfirmed(false)}>
                    Pre-order Another Copy
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={onClose}>
                    Return to ComplyEasy
                  </button>
                </div>
              </div>
            ) : (
              <div className="gta-preorder-grid">
                {/* Left: Editions */}
                <div className="gta-editions-col">
                  <h3 className="gta-section-title">Select Edition</h3>
                  <div className="gta-edition-cards">
                    {EDITIONS.map((ed) => {
                      const isSelected = selectedEdition === ed.id;
                      return (
                        <div
                          key={ed.id}
                          className={`gta-edition-card${isSelected ? ' selected' : ''}`}
                          onClick={() => setSelectedEdition(ed.id)}
                        >
                          <img src={ed.image} alt={ed.name} className="gta-edition-thumb" />
                          <div className="gta-edition-info">
                            <div className="gta-edition-top">
                              <span className="gta-edition-name">{ed.name}</span>
                              <span className="gta-edition-badge">{ed.badge}</span>
                            </div>
                            <div className="gta-edition-price">{ed.price}</div>
                            <ul className="gta-edition-features">
                              {ed.features.slice(0, 3).map((f, i) => (
                                <li key={i}>✓ {f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Platform & Checkout */}
                <div className="gta-checkout-col">
                  <h3 className="gta-section-title">Select Platform</h3>
                  <div className="gta-platform-selector">
                    {PLATFORMS.map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        className={`gta-platform-btn${selectedPlatform === plat.id ? ' active' : ''}`}
                        onClick={() => setSelectedPlatform(plat.id)}
                      >
                        <span className="gta-platform-icon">{plat.icon}</span>
                        <span>{plat.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="gta-order-summary-box">
                    <div className="gta-order-summary-row">
                      <span>Edition</span>
                      <strong>{currentEdition.name}</strong>
                    </div>
                    <div className="gta-order-summary-row">
                      <span>Platform</span>
                      <strong>{PLATFORMS.find((p) => p.id === selectedPlatform)?.label}</strong>
                    </div>
                    <div className="gta-order-summary-row">
                      <span>Launch Window</span>
                      <strong style={{ color: '#00f0ff' }}>Fall 2026</strong>
                    </div>
                    <div className="gta-order-summary-divider" />
                    <div className="gta-order-summary-row total">
                      <span>Total Due Today</span>
                      <strong className="gta-price-highlight">{currentEdition.price}</strong>
                    </div>

                    <button type="button" className="gta-checkout-btn" onClick={handleConfirm}>
                      PRE-ORDER FOR {currentEdition.price} →
                    </button>

                    <div className="gta-guarantee-row">
                      <span>🔒 Official Rockstar Verified Pre-Order</span>
                      <span>·</span>
                      <span>100% Refundable Anytime</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Trailer */}
        {tab === 'trailer' && (
          <div className="gta-modal-body">
            <div className="gta-video-container">
              <iframe
                title="Grand Theft Auto VI Trailer 1"
                src="https://www.youtube-nocookie.com/embed/QdBZY2fkU-0?autoplay=1&rel=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="gta-video-frame"
              />
            </div>
            <div className="gta-trailer-meta">
              <div>
                <h4 style={{ color: '#fff', margin: '0 0 4px', fontSize: 18 }}>Grand Theft Auto VI Trailer 1</h4>
                <p style={{ color: '#a09ab8', margin: 0, fontSize: 13 }}>
                  Song: &quot;Love Is A Long Road&quot; by Tom Petty · Official 4K 60FPS Video · 220+ Million Views
                </p>
              </div>
              <button
                type="button"
                className="gta-preorder-btn"
                style={{ padding: '10px 22px', fontSize: 13 }}
                onClick={() => setTab('preorder')}
              >
                PRE-ORDER NOW
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Gallery */}
        {tab === 'gallery' && (
          <div className="gta-modal-body">
            <div className="gta-gallery-grid">
              <div className="gta-gallery-item wide">
                <img src="/ads/gta6-official-rooftop.jpg" alt="Jason and Lucia Rooftop" />
                <span className="gta-gallery-caption">Jason &amp; Lucia · Downtown Vice City Overlook</span>
              </div>
              <div className="gta-gallery-item">
                <img src="/ads/gta6-official-hero.jpg" alt="Vice City Getaway" />
                <span className="gta-gallery-caption">Vice City Highways &amp; Palm Canopies</span>
              </div>
              <div className="gta-gallery-item">
                <img src="/ads/gta6-trailer-art.jpg" alt="Leonida Keys" />
                <span className="gta-gallery-caption">Leonida Everglades &amp; Coastlines</span>
              </div>
              <div className="gta-gallery-item">
                <img src="/ads/gta6-meta-banner.jpg" alt="Neon Ocean Drive" />
                <span className="gta-gallery-caption">Ocean Drive Neon Nightlife</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="gta-modal-footer">
          <div className="gta-footer-left">
            <span className="gta-esrb-badge">ESRB: M 17+</span>
            <span className="gta-footer-legal">
              © 2026 Rockstar Games, Inc. Grand Theft Auto, GTA, and Rockstar Games are trademarks of Take-Two Interactive Software.
            </span>
          </div>
          <div className="gta-footer-right">
            <span>ComplyEasy Free Tier Sponsor · </span>
            <Link to="/plan" onClick={onClose} style={{ color: '#00f0ff', fontWeight: 600 }}>
              Upgrade to Pro to remove ads
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

