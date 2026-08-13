"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { BackButton } from "@/components/BackButton";
import { NextButton } from "@/components/NextButton";
import styles from "./Header.module.css";

export interface HeaderProps {
  brandName?: string;
  onVolumeClick?: () => void;
  showVolumeButton?: boolean;
  isMuted?: boolean;
  /** Step-back handler. The back control only renders when this is provided. */
  onBackClick?: () => void;
  showBackButton?: boolean;
  /**
   * Step-forward handler. This is the old skip control: it advances past the
   * avatar segment currently playing. Only renders when provided, and the
   * caller decides when there is anything to advance to.
   */
  onNextClick?: () => void;
  showNextButton?: boolean;
  /**
   * Below 1024px, move Back and Next out of the header to the viewport's left
   * and right edges. Off for steps whose content runs full width and scrolls,
   * where an edge-pinned control would sit on top of that content.
   */
  edgeNavOnNarrow?: boolean;
  centerContent?: React.ReactNode;
  /** Content rendered below the header row on mobile only */
  mobileContent?: React.ReactNode;
}

export function Header({
  brandName = "Better Sleep Tonight",
  onVolumeClick,
  showVolumeButton = true,
  isMuted = true,
  onBackClick,
  showBackButton = false,
  onNextClick,
  showNextButton = false,
  edgeNavOnNarrow = true,
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
            fetchPriority="high"
          />
        </Link>

        {/* Center Content (e.g., StepIndicator) */}
        {centerContent && (
          <div className={styles.centerContent}>{centerContent}</div>
        )}

        {/* Actions - Top Right */}
        <div
          className={`${styles.headerActions} ${
            edgeNavOnNarrow ? styles.edgeNav : ""
          }`}
        >
          {showBackButton && onBackClick && <BackButton onClick={onBackClick} />}

          {showNextButton && onNextClick && <NextButton onClick={onNextClick} />}

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
      </div>

      {/* Mobile-only content below header row */}
      {mobileContent && (
        <div className={styles.mobileContent}>{mobileContent}</div>
      )}
    </header>
  );
}
