'use client';
import { useState, useEffect } from 'react';

export interface BatteryInfo {
  level: number;       // 0–100
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
      setInfo({
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        supported: true,
      });
    };

    (navigator as any).getBattery().then((b: any) => {
      battery = b;
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    }).catch(() => {});

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return info;
}
