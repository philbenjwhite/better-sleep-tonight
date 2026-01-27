'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Show progress bar above footer */
  showProgress?: boolean;
  /** Current step (1-indexed) for progress bar */
  currentStep?: number;
  /** Total number of steps for progress bar */
  totalSteps?: number;
  /** Show avatar section above footer content (mobile only) */
  showAvatarSection?: boolean;
  /** Video source for avatar */
  avatarVideoSrc?: string;
  /** Text to display next to avatar */
  avatarText?: string;
  /** Controls audio mute state for the avatar video */
  isMuted?: boolean;
}

export function Footer({
  showProgress = false,
  currentStep = 0,
  totalSteps = 0,
  showAvatarSection = false,
  avatarVideoSrc,
  avatarText,
  isMuted = true,
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
      {showAvatarSection && avatarVideoSrc && (
        <div className={styles.avatarSection}>
          <video
            className={styles.avatarVideo}
            src={avatarVideoSrc}
            autoPlay
            playsInline
            muted={isMuted}
          />
          {avatarText && <p className={styles.avatarText}>{avatarText}</p>}
        </div>
      )}
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          © 2025 BetterSleep Tonight. All rights reserved.
        </p>
        <Link href="/privacy-policy" className={styles.privacyPolicy}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
