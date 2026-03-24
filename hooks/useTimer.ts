'use client';
import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialTime: number, onTimeUp: (() => void) | null) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newTime: number) => {
    setTimeLeft(newTime);
    setIsRunning(false);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isInitialized) {
      setIsRunning(false);
      if (onTimeUp) onTimeUp();
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, timeLeft, onTimeUp, isInitialized]);

  return { timeLeft, formattedTime: formatTime(timeLeft), isRunning, start, stop, reset };
};
