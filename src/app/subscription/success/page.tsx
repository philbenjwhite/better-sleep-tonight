'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSubscription, Subscription } from '@/hooks';
import styles from '../subscription.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { getSubscriptionStatus, isLoading } = useSubscription();
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (sessionId) {
      getSubscriptionStatus(sessionId).then(setSubscription);
    }
  }, [sessionId, getSubscriptionStatus]);

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconSuccess}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className={styles.title}>Welcome to Premium!</h1>
        <p className={styles.description}>
          Your subscription is now active. You have full access to all premium features.
        </p>

        {isLoading && (
          <p className={styles.loading}>Confirming your subscription...</p>
        )}

        {subscription && (
          <div className={styles.details}>
            <p>Subscription ID: {subscription.id}</p>
            <p>Status: {subscription.status}</p>
          </div>
        )}

        <Link href="/" className={styles.button}>
          Continue to App
        </Link>
      </div>
    </main>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.content}><p>Loading...</p></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
