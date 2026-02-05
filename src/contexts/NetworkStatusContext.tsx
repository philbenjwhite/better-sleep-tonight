'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useNetworkStatus, ConnectionQuality } from '@/hooks/useNetworkStatus';

interface NetworkStatusContextType {
  quality: ConnectionQuality;
  effectiveType: string | null;
  downlink: number | null;
  saveData: boolean;
  isOnline: boolean;
  isSlow: boolean;
  shouldReduceData: boolean;
  measureSpeed: () => Promise<number | null>;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | null>(null);

interface NetworkStatusProviderProps {
  children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
  const networkStatus = useNetworkStatus();

  const value: NetworkStatusContextType = {
    ...networkStatus,
    isSlow:
      networkStatus.quality === ConnectionQuality.SLOW ||
      networkStatus.quality === ConnectionQuality.OFFLINE,
    shouldReduceData:
      networkStatus.saveData ||
      networkStatus.quality === ConnectionQuality.SLOW ||
      networkStatus.quality === ConnectionQuality.OFFLINE,
  };

  return (
    <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>
  );
}

export function useNetworkStatusContext(): NetworkStatusContextType {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatusContext must be used within a NetworkStatusProvider');
  }
  return context;
}

export { ConnectionQuality };
