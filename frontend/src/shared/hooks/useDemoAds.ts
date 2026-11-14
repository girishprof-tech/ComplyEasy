import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ce_demo_ads_visible';

export function getDemoAdsVisible(): boolean {
  const val = localStorage.getItem(STORAGE_KEY);
  // Default to true unless explicitly toggled off
  return val === null ? true : val === 'true';
}

export function setDemoAdsVisible(visible: boolean) {
  localStorage.setItem(STORAGE_KEY, String(visible));
  window.dispatchEvent(new CustomEvent('ce_demo_ads_toggled', { detail: visible }));
}

export function useDemoAds() {
  const [visible, setVisible] = useState(getDemoAdsVisible);

  useEffect(() => {
    function handleToggle(e: Event) {
      const customEvent = e as CustomEvent<boolean>;
      setVisible(customEvent.detail);
    }
    window.addEventListener('ce_demo_ads_toggled', handleToggle);
    return () => window.removeEventListener('ce_demo_ads_toggled', handleToggle);
  }, []);

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    setDemoAdsVisible(next);
  };

  return { adsVisible: visible, toggleAds: toggle, setAdsVisible: (v: boolean) => { setVisible(v); setDemoAdsVisible(v); } };
}

