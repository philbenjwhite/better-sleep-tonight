'use client';

import Image from 'next/image';
import styles from './Header.module.css';

export interface HeaderProps {
  brandName?: string;
  onVolumeClick?: () => void;
}

export function Header({ brandName = 'Better Sleep Tonight', onVolumeClick }: HeaderProps) {
  return (
    <header className={styles.header}>
      {/* Logo - Top Left */}
      <div className={styles.logo}>
        <div className={styles.logoPlaceholder}>{brandName}</div>
      </div>

      {/* Volume Icon - Top Right */}
      <button
        className={styles.volumeButton}
        aria-label="Toggle audio"
        onClick={onVolumeClick}
      >
        <Image
          src="/images/volume-icon.svg"
          alt=""
          width={20}
          height={20}
        />
      </button>
    </header>
  );
}
