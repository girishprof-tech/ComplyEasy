import { useLocation } from 'react-router-dom';
import type { AccountSummary } from '@/types';
import { useAccount } from '@/features/account/hooks/useAccount';
import { useDemoAds } from '@/shared/hooks/useDemoAds';

interface Props {
  account?: AccountSummary | null;
  slot?: number;
  variant?: 'wide' | 'square' | 'standard' | 'trailer' | 'ticker';
  className?: string;
}

export function AdBanner({
  account: propAccount,
  variant = 'standard',
  className = '',
}: Props) {
  const location = useLocation();
  const internalAccount = useAccount();
  const account = propAccount !== undefined ? propAccount : internalAccount;
  const { adsVisible } = useDemoAds();

  // 1. Strictly do NOT show any ads on the landing page, login, or register pages
  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/activate'
  ) {
    return null;
  }

  // 2. Hide ticker variant completely
  if (variant === 'ticker') {
    return null;
  }

  // 3. If user disabled demo ads OR upgraded to Pro, hide ads completely
  if (!adsVisible || (account && account.tier === 'pro')) {
    return null;
  }

  // 4. Render clean box with "AD here"
  const variantClass =
    variant === 'wide'
      ? 'ad-box-wide'
      : variant === 'square'
      ? 'ad-box-square'
      : 'ad-box-standard';

  return (
    <aside
      className={`ad-box-placeholder ${variantClass} ${className}`.trim()}
      aria-label="Advertisement"
    >
      <span className="ad-box-text">AD here</span>
    </aside>
  );
}
