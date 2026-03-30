'use client';
import { useState, useEffect } from 'react';

export interface BatteryInfo {
  level: number;
  charging: boolean;
  supported: boolean;
}

export function useBattery(): BatteryInfo {
  const [info, setInfo] = useState<BatteryInfo>({ level: 100, charging: false, supported: false });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !(navigator as any).getBattery) return;

    let battery: any = null;

    const update = () => {
      if (!battery) return;
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      const dischargingTime = battery.dischargingTime;

      // Desktop Chrome always returns level=1.0, charging=true, dischargingTime=Infinity
      // Real battery will have a finite dischargingTime or level < 100 at some point
      // We show it regardless — if it's always 100% charging, user can ignore it
      setInfo({ level, charging, supported: true });
    };

    (navigator as any).getBattery().then((b: any) => {
      battery = b;
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    }).catch(() => {
      // getBattery not supported or permission denied
    });

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return info;
}
