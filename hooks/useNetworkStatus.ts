'use client';
import { useState, useEffect, useRef } from 'react';

export type SignalStrength = 0 | 1 | 2 | 3 | 4;

async function pingServer(): Promise<{ online: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch('/api/ping', {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000), // 4s timeout
    });
    if (!res.ok) return { online: false, latencyMs: 9999 };
    return { online: true, latencyMs: Date.now() - start };
  } catch {
    return { online: false, latencyMs: 9999 };
  }
}

function latencyToSignal(ms: number): SignalStrength {
  if (ms < 150)  return 4;
  if (ms < 400)  return 3;
  if (ms < 1000) return 2;
  return 1;
}

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);
  const [signal, setSignal] = useState<SignalStrength>(4);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const wasOnlineRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      const { online: isOnline, latencyMs } = await pingServer();
      if (cancelled) return;

      setOnline(isOnline);
      setSignal(isOnline ? latencyToSignal(latencyMs) : 0);

      if (!isOnline && wasOnlineRef.current) {
        setShowOfflineModal(true);
      }
      if (isOnline && !wasOnlineRef.current) {
        setShowOfflineModal(false);
      }
      wasOnlineRef.current = isOnline;
    };

    check();
    const interval = setInterval(check, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { online, signal, showOfflineModal, dismissOfflineModal: () => setShowOfflineModal(false) };
}
