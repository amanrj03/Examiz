'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { attemptAPI } from '../services/api';

export const useTimeTracking = (attemptId: string | null) => {
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [isTracking, setIsTracking] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSyncRef = useRef<Record<string, number>>({});
  const currentQuestionIdRef = useRef<string | null>(null);
  const isTrackingRef = useRef(false);

  const stopCurrentTimer = useCallback(() => {
    const activeId = currentQuestionIdRef.current;
    const activeStart = startTimeRef.current;
    if (!activeId || !activeStart || !isTrackingRef.current) return;
    const timeSpent = Math.floor((Date.now() - activeStart) / 1000);
    if (timeSpent > 0) {
      setQuestionTimes((prev) => ({ ...prev, [activeId]: (prev[activeId] || 0) + timeSpent }));
      pendingSyncRef.current[activeId] = (pendingSyncRef.current[activeId] || 0) + timeSpent;
    }
    startTimeRef.current = null;
    currentQuestionIdRef.current = null;
    isTrackingRef.current = false;
    setCurrentQuestionId(null);
    setIsTracking(false);
  }, []);

  const startQuestionTimer = useCallback((questionId: string) => {
    if (!questionId || !attemptId) return;
    if (startTimeRef.current || isTrackingRef.current) stopCurrentTimer();
    currentQuestionIdRef.current = questionId;
    isTrackingRef.current = true;
    startTimeRef.current = Date.now();
    setCurrentQuestionId(questionId);
    setIsTracking(true);
  }, [attemptId, stopCurrentTimer]);

  const syncTimeData = useCallback(async () => {
    if (!attemptId || Object.keys(pendingSyncRef.current).length === 0) return;
    try {
      const timeData = { ...pendingSyncRef.current };
      pendingSyncRef.current = {};
      await attemptAPI.syncTimeData(attemptId, { questionTimes: timeData });
    } catch {
      // ignore
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    syncIntervalRef.current = setInterval(() => syncTimeData(), 15000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (startTimeRef.current) stopCurrentTimer();
    };
  }, [attemptId, syncTimeData, stopCurrentTimer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopCurrentTimer();
      else if (currentQuestionIdRef.current) startQuestionTimer(currentQuestionIdRef.current);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startQuestionTimer, stopCurrentTimer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCurrentTimer();
      if (Object.keys(pendingSyncRef.current).length > 0) {
        navigator.sendBeacon(`/api/attempts/${attemptId}/sync-times`, JSON.stringify({ questionTimes: pendingSyncRef.current }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, stopCurrentTimer]);

  useEffect(() => {
    return () => { stopCurrentTimer(); syncTimeData(); };
  }, [stopCurrentTimer, syncTimeData]);

  const getCurrentQuestionTime = useCallback((questionId: string): number => {
    let total = questionTimes[questionId] || 0;
    if (questionId === currentQuestionIdRef.current && startTimeRef.current && isTrackingRef.current) {
      total += Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    return total;
  }, [questionTimes]);

  const getTotalTime = useCallback(() => Object.values(questionTimes).reduce((s, t) => s + t, 0), [questionTimes]);

  return { startQuestionTimer, stopCurrentTimer, syncTimeData, getCurrentQuestionTime, getTotalTime, questionTimes, currentQuestionId, isTracking };
};

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};
