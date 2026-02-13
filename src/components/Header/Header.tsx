"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import styles from "./Header.module.css";

export interface HeaderProps {
  brandName?: string;
  onVolumeClick?: () => void;
  showVolumeButton?: boolean;
  isMuted?: boolean;
  centerContent?: React.ReactNode;
  /** Content rendered below the header row on mobile only */
  mobileContent?: React.ReactNode;
}

export function Header({
  brandName = "Better Sleep Tonight",
  onVolumeClick,
  showVolumeButton = true,
  isMuted = true,
  centerContent,
  mobileContent,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.headerRow}>
        {/* Logo - Top Left */}
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/bst-logo.png"
            alt={brandName}
            width={238}
            height={64}
            className={styles.logoImage}
            priority
          />
        </Link>

        {/* Center Content (e.g., StepIndicator) */}
        {centerContent && (
          <div className={styles.centerContent}>{centerContent}</div>
        )}

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
      </div>

      {/* Mobile-only content below header row */}
      {mobileContent && (
        <div className={styles.mobileContent}>{mobileContent}</div>
      )}
    </header>
  );
}
