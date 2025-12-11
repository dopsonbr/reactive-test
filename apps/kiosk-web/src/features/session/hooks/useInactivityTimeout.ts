import { useEffect, useState, useCallback } from 'react';
import { useKioskSession } from '../context/KioskSessionContext';
import { logger } from '../../../shared/utils/logger';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  onTimeout?: () => void;
}

export function useInactivityTimeout({
  timeoutMs = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT) || 120000, // 2 minutes default
  warningMs = Number(import.meta.env.VITE_INACTIVITY_WARNING) || 30000, // 30 seconds default
  onTimeout,
}: UseInactivityTimeoutOptions = {}) {
  const { transactionState, lastActivityTime, resetTransaction } = useKioskSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeoutMs);

  const handleTimeout = useCallback(() => {
    logger.warn('Inactivity timeout reached - resetting transaction');
    setShowWarning(false);
    resetTransaction();
    onTimeout?.();
  }, [resetTransaction, onTimeout]);

  useEffect(() => {
    // Only monitor during active transactions
    if (transactionState !== 'active' && transactionState !== 'checkout') {
      setShowWarning(false);
      return;
    }

    // Update time remaining every second
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActivityTime;
      const remaining = timeoutMs - elapsed;

      setTimeRemaining(Math.max(0, remaining));

      // Show warning when approaching timeout
      if (remaining <= warningMs && remaining > 0) {
        setShowWarning(true);
      } else if (remaining > warningMs) {
        setShowWarning(false);
      }

      // Trigger timeout
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [transactionState, lastActivityTime, timeoutMs, warningMs, handleTimeout]);

  return {
    showWarning,
    timeRemaining: Math.ceil(timeRemaining / 1000), // Convert to seconds
    dismissWarning: () => setShowWarning(false),
  };
}
