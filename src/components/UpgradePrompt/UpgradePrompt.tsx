'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/hooks';
import styles from './UpgradePrompt.module.css';

export interface UpgradePromptProps {
  title?: string;
  description?: string;
  features?: string[];
  priceDisplay?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onViewProposals?: () => void;
  customerEmail?: string;
}

export function UpgradePrompt({
  title = 'Upgrade to Premium',
  description = 'Get unlimited access to all features and personalized recommendations.',
  features = [
    'Unlimited sleep assessments',
    'Personalized mattress recommendations',
    'Priority support',
    'Exclusive discounts',
  ],
  priceDisplay = '$9.99/month',
  primaryButtonText = 'Upgrade Now',
  secondaryButtonText = 'View Proposals',
  onViewProposals,
  customerEmail,
}: UpgradePromptProps) {
  const { createCheckoutSession, isLoading, error } = useSubscription();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLocalError(null);
    try {
      await createCheckoutSession({ customerEmail });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  const displayError = localError || error;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>

        {features.length > 0 && (
          <ul className={styles.features}>
            {features.map((feature, index) => (
              <li key={index} className={styles.feature}>
                <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        )}

        <p className={styles.price}>{priceDisplay}</p>

        {displayError && (
          <p className={styles.error}>{displayError}</p>
        )}

        <div className={styles.buttons}>
          {onViewProposals && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onViewProposals}
              disabled={isLoading}
            >
              {secondaryButtonText}
            </button>
          )}
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : primaryButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradePrompt;
