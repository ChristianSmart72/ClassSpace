import { useState, useEffect, useCallback } from 'react';

const DISMISS_KEY = 'install_dismissed';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const dm = matchMedia('(display-mode: standalone)');
      if (dm.matches) setIsInstalled(true);
      dm.addEventListener('change', (e) => setIsInstalled(e.matches));
    } catch {}
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (ts && Date.now() - Number(ts) < 30 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDeferredPrompt(null);
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
  }, []);

  const isInstallable = !!deferredPrompt && !isInstalled && !dismissed;

  return { isInstallable, install, dismiss, isInstalled };
}
