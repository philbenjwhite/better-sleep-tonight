'use client';

import { useCallback, useEffect, useState } from 'react';

export enum ConnectionQuality {
  FAST = 'fast',
  MODERATE = 'moderate',
  SLOW = 'slow',
  OFFLINE = 'offline',
}

interface NetworkStatus {
  quality: ConnectionQuality;
  effectiveType: string | null;
  downlink: number | null;
  saveData: boolean;
  isOnline: boolean;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  measureSpeed: () => Promise<number | null>;
}

// Extend Navigator interface for Network Information API
interface NetworkInformation {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
}

function determineQuality(
  effectiveType: string | null,
  downlink: number | null,
  isOnline: boolean
): ConnectionQuality {
  if (!isOnline) return ConnectionQuality.OFFLINE;

  // Use effectiveType if available (Network Information API)
  if (effectiveType) {
    switch (effectiveType) {
      case '4g':
        return ConnectionQuality.FAST;
      case '3g':
        return ConnectionQuality.MODERATE;
      case '2g':
      case 'slow-2g':
        return ConnectionQuality.SLOW;
    }
  }

  // Fall back to downlink speed if available
  if (downlink !== null) {
    if (downlink >= 5) return ConnectionQuality.FAST;
    if (downlink >= 1) return ConnectionQuality.MODERATE;
    return ConnectionQuality.SLOW;
  }

  // Default to FAST if we can't determine
  return ConnectionQuality.FAST;
}

/**
 * Hook for detecting network connection quality
 * Uses Network Information API where available, with fallback to speed test
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    const connection = getConnection();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    return {
      quality: ConnectionQuality.FAST,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      saveData: connection?.saveData || false,
      isOnline,
    };
  });

  // Measure actual download speed using a small test file
  const measureSpeed = useCallback(async (): Promise<number | null> => {
    try {
      const testUrl = '/api/speed-test'; // Small endpoint for speed testing
      const startTime = performance.now();

      const response = await fetch(testUrl, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) return null;

      const blob = await response.blob();
      const endTime = performance.now();

      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeKB = blob.size / 1024;
      const speedMbps = (fileSizeKB * 8) / 1000 / durationSeconds;

      return speedMbps;
    } catch {
      return null;
    }
  }, []);

  // Update quality based on measured speed
  const updateQualityFromSpeed = useCallback(async () => {
    const connection = getConnection();

    // If Network Information API is available and provides effectiveType, trust it
    if (connection?.effectiveType) {
      return;
    }

    // Otherwise, measure speed
    const measuredSpeed = await measureSpeed();
    if (measuredSpeed !== null) {
      setStatus((prev) => ({
        ...prev,
        downlink: measuredSpeed,
        quality: determineQuality(null, measuredSpeed, prev.isOnline),
      }));
    }
  }, [measureSpeed]);

  useEffect(() => {
    const connection = getConnection();

    const updateStatus = () => {
      const conn = getConnection();
      const isOnline = navigator.onLine;

      setStatus({
        quality: determineQuality(conn?.effectiveType || null, conn?.downlink || null, isOnline),
        effectiveType: conn?.effectiveType || null,
        downlink: conn?.downlink || null,
        saveData: conn?.saveData || false,
        isOnline,
      });
    };

    // Listen for connection changes
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateStatus);
    }

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Initial speed test if Network Information API not available
    if (!connection?.effectiveType) {
      updateQualityFromSpeed();
    }

    return () => {
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateStatus);
      }
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [updateQualityFromSpeed]);

  return {
    ...status,
    measureSpeed,
  };
}
