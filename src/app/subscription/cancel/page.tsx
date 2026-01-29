import Link from 'next/link';
import styles from '../subscription.module.css';

export default function SubscriptionCancelPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className={styles.title}>Checkout Cancelled</h1>
        <p className={styles.description}>
          No worries! Your subscription checkout was cancelled. You can try again whenever you&apos;re ready.
        </p>

        <Link href="/" className={styles.button}>
          Return to App
        </Link>
      </div>
    </main>
  );
}
