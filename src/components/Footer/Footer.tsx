'use client';

import { useState } from 'react';
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
  const [isAvatarDismissed, setIsAvatarDismissed] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const handleDismiss = () => {
    setIsSliding(true);
    // After animation completes, fully hide the element
    setTimeout(() => {
      setIsAvatarDismissed(true);
    }, 300); // Match CSS transition duration
  };

  const handleVideoEnded = () => {
    handleDismiss();
  };

  return (
    <footer className={styles.footer}>
      {/* Avatar section renders above progress bar (mobile only via CSS) */}
      {showAvatarSection && avatarVideoSrc && !isAvatarDismissed && (
        <div className={`${styles.avatarSection} ${isSliding ? styles.avatarSlideOut : ''}`}>
          <button
            type="button"
            className={styles.avatarDismissButton}
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <video
            className={styles.avatarVideo}
            src={avatarVideoSrc}
            autoPlay
            playsInline
            muted={isMuted}
            onEnded={handleVideoEnded}
          />
          {avatarText && <p className={styles.avatarText}>{avatarText}</p>}
        </div>
      )}
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
        <Link href="/privacy-policy" className={styles.privacyPolicy}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
