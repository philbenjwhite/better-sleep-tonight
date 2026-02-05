'use client';

import { ReactNode } from 'react';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <NetworkStatusProvider>{children}</NetworkStatusProvider>;
}
