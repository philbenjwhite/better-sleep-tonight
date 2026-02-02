'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import styles from './Header.module.css';

export interface HeaderProps {
  brandName?: string;
  onVolumeClick?: () => void;
  showVolumeButton?: boolean;
  isMuted?: boolean;
}

export function Header({ brandName = 'Better Sleep Tonight', onVolumeClick, showVolumeButton = true, isMuted = true }: HeaderProps) {
  return (
    <header className={styles.header}>
      {/* Logo - Top Left */}
      <Link href="/" className={styles.logo}>
        <Image
          src="/images/bst-logo.svg"
          alt={brandName}
          width={238}
          height={64}
          className={styles.logoImage}
          priority
        />
      </Link>

      {/* Volume Icon - Top Right */}
      {showVolumeButton && (
        <button
          className={styles.volumeButton}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          data-tooltip={isMuted ? "Sound off" : "Sound on"}
          onClick={onVolumeClick}
        >
          {isMuted ? (
            <SpeakerSlash size={20} weight="bold" color="#363534" />
          ) : (
            <SpeakerHigh size={20} weight="bold" color="#363534" />
          )}
        </button>
      )}
    </header>
  );
}
