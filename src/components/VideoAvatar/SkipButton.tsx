"use client";

import React from "react";
import styles from "./SkipButton.module.css";

export interface SkipButtonProps {
  /** Called when the user skips. Should advance the funnel to the next step. */
  onSkip: () => void;
  className?: string;
}

export const SkipButton: React.FC<SkipButtonProps> = ({
  onSkip,
  className,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // The page wrapper listens for taps to unmute on mobile — don't trigger
    // that when the user is deliberately skipping.
    event.stopPropagation();
    onSkip();
  };

  return (
    <button
      type="button"
      className={`${styles.skipButton} ${className || ""}`}
      onClick={handleClick}
      aria-label="Skip video"
    >
      <span className={styles.label}>Skip</span>
    </button>
  );
};

export default SkipButton;
