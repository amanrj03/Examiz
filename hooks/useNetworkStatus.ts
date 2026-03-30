'use client';
import { useState, useEffect } from 'react';

export type SignalStrength = 0 | 1 | 2 | 3 | 4; // 0 = offline

function getSignalStrength(): SignalStrength {
  if (typeof navigator === 'undefined') return 4;
  if (!navigator.onLine) return 0;

  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (!conn) return 4; // API not supported — assume good

  const { effectiveType, downlink } = conn;
  if (effectiveType === 'slow-2g') return 1;
  if (effectiveType === '2g') return 2;
  if (effectiveType === '3g') return 3;
  if (downlink !== undefined) {
    if (downlink < 1) return 2;
    if (downlink < 5) return 3;
  }
  return 4;
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);
  const [signal, setSignal] = useState<SignalStrength>(4);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      setSignal(isOnline ? getSignalStrength() : 0);
      if (!isOnline) setShowOfflineModal(true);
      else setShowOfflineModal(false);
    };

    update();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    const conn = (navigator as any).connection;
    if (conn) conn.addEventListener('change', update);

    const interval = setInterval(update, 5000);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (conn) conn.removeEventListener('change', update);
      clearInterval(interval);
    };
  }, []);

  return { online, signal, showOfflineModal, dismissOfflineModal: () => setShowOfflineModal(false) };
}
