"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import styles from "./Header.module.css";

/**
 * Brand, progress and sound.
 *
 * Back and Next used to live here too, pinned to the viewport edges below
 * 1024px, where they landed on the answer options. They are now a row in the
 * footer, in the layout instead of over it — see FooterProps.nav.
 */
/**
 * How much the visual viewport has to lose before it counts as a keyboard
 * rather than as a browser toolbar sliding away. A phone keyboard takes around
 * a third of the screen; a toolbar is a few tens of pixels.
 */
const KEYBOARD_HEIGHT_THRESHOLD = 150;

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

  /**
   * Turn the fade on whenever something can pass under the header.
   *
   * A window scroll is only one of the ways that happens. Focusing the email
   * field on the booking step is another: that step is exactly one viewport
   * tall and nothing on it is scrollable, but iOS still lifts the page to keep
   * the field above the keyboard. It reports that on the visual viewport
   * rather than as a document scroll, so window.scrollY stayed at 0 and the
   * card slid up through the logo with nothing behind it.
   *
   * The keyboard check covers the same shift where the page is lifted by
   * resizing the visual viewport instead of offsetting it. visualViewport is
   * absent on nothing current, and its absence just leaves the scroll test.
   */
  useEffect(() => {
    const viewport = window.visualViewport;

    const update = () => {
      const lifted = viewport ? viewport.offsetTop > 0 : false;
      const keyboardOpen = viewport
        ? viewport.height < window.innerHeight - KEYBOARD_HEIGHT_THRESHOLD
        : false;
      setIsScrolled(window.scrollY > 0 || lifted || keyboardOpen);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("scroll", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
    };
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
        <div className={styles.headerActions}>
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
