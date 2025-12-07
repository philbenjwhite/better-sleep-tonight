'use client';

import styles from './Footer.module.css';

export interface FooterProps {
  /** Show progress bar above footer */
  showProgress?: boolean;
  /** Current step (1-indexed) for progress bar */
  currentStep?: number;
  /** Total number of steps for progress bar */
  totalSteps?: number;
}

export function Footer({
  showProgress = false,
  currentStep = 0,
  totalSteps = 0,
}: FooterProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <footer className={styles.footer}>
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          © 2025 BetterSleep Tonight. All rights reserved.
        </p>
        <p className={styles.privacyPolicy}>
          Privacy Policy
        </p>
      </div>
    </footer>
  );
}
