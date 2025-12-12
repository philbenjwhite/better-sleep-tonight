'use client';

import Image from 'next/image';
import Link from 'next/link';
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
          onClick={onVolumeClick}
        >
          <Image
            src={isMuted ? "/images/volume-mute-icon.svg" : "/images/volume-icon.svg"}
            alt=""
            width={20}
            height={20}
          />
        </button>
      )}
    </header>
  );
}
