'use client';

import { useState, useCallback } from 'react';
import { getStripe } from '@/lib/stripe/client';

export interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface UseSubscriptionReturn {
  isLoading: boolean;
  error: string | null;
  createCheckoutSession: (options?: { priceId?: string; customerEmail?: string }) => Promise<void>;
  getSubscriptionStatus: (sessionId: string) => Promise<Subscription | null>;
  cancelSubscription: (subscriptionId: string) => Promise<Subscription | null>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (options?: { priceId?: string; customerEmail?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: options?.priceId,
          customerEmail: options?.customerEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await res.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSubscriptionStatus = useCallback(async (sessionId: string): Promise<Subscription | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stripe/subscription?sessionId=${sessionId}`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get subscription status');
      }

      const { subscription } = await res.json();
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get subscription status';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string): Promise<Subscription | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stripe/subscription?subscriptionId=${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      const { subscription } = await res.json();
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createCheckoutSession,
    getSubscriptionStatus,
    cancelSubscription,
  };
}
