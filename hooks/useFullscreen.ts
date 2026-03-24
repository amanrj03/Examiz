'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useFullscreen = (
  onWarning: ((count: number) => void) | null,
  onShowModal: ((data: { title: string; message: string }) => void) | null,
  onAutoSubmit: (() => void) | null
) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusTime = useRef(Date.now());
  const warningCountRef = useRef(0);
  const showWarningModalRef = useRef(false);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement as HTMLElement & {
      mozRequestFullScreen?: () => void;
      webkitRequestFullscreen?: () => void;
      msRequestFullscreen?: () => void;
    };
    try {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } catch {}
  }, []);

  const exitFullscreen = useCallback(() => {
    const doc = document as Document & {
      mozCancelFullScreen?: () => void;
      webkitExitFullscreen?: () => void;
      msExitFullscreen?: () => void;
    };
    if (doc.exitFullscreen) doc.exitFullscreen();
    else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    else if (doc.msExitFullscreen) doc.msExitFullscreen();
  }, []);

  const triggerWarning = useCallback((reason = 'fullscreen violation') => {
    if (warningCountRef.current >= 5) {
      if (onAutoSubmit) onAutoSubmit();
      return;
    }
    const newCount = warningCountRef.current + 1;
    warningCountRef.current = newCount;
    setWarningCount(newCount);
    if (onWarning) onWarning(newCount);
    showWarningModalRef.current = true;
    setShowWarningModal(true);
    warningTimeoutRef.current = setTimeout(() => {
      showWarningModalRef.current = false;
      setShowWarningModal(false);
      if (onAutoSubmit) onAutoSubmit();
    }, 60000);
    if (newCount >= 5) {
      setTimeout(() => {
        showWarningModalRef.current = false;
        setShowWarningModal(false);
        if (onAutoSubmit) onAutoSubmit();
      }, 1000);
    }
  }, [onWarning, onAutoSubmit]);

  const handleWarningOk = useCallback(() => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    showWarningModalRef.current = false;
    setShowWarningModal(false);
    if (!isFullscreen) enterFullscreen();
  }, [isFullscreen, enterFullscreen]);

  const handleWarningTimeout = useCallback(() => {
    showWarningModalRef.current = false;
    setShowWarningModal(false);
    if (onAutoSubmit) onAutoSubmit();
  }, [onAutoSubmit]);

  const handleFullscreenChange = useCallback(() => {
    const doc = document as Document & {
      mozFullScreenElement?: Element | null;
      webkitFullscreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    };
    const isFull = !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
    setIsFullscreen(isFull);
    if (!isFull && !showWarningModalRef.current) triggerWarning('exiting fullscreen mode');
  }, [triggerWarning]);

  const handleWindowBlur = useCallback(() => { lastFocusTime.current = Date.now(); }, []);
  const handleWindowFocus = useCallback(() => {
    const lost = Date.now() - lastFocusTime.current;
    if (lost > 500 && !showWarningModalRef.current) triggerWarning('window switching or Alt+Tab');
  }, [triggerWarning]);
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !showWarningModalRef.current) triggerWarning('tab switching');
  }, [triggerWarning]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [handleFullscreenChange, handleWindowBlur, handleWindowFocus, handleVisibilityChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || e.key === 'Escape' || (e.altKey && e.key === 'Tab') ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        e.preventDefault();
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return { isFullscreen, warningCount, showWarningModal, enterFullscreen, exitFullscreen, handleWarningOk, handleWarningTimeout };
};
