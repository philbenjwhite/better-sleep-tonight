"use client";

import classNames from "classnames";
import { ArrowRight } from "@phosphor-icons/react";
import styles from "./NextButton.module.css";

export interface NextButtonProps {
  onClick?: () => void;
  /** Visible label; hidden at tablet widths, always kept as the accessible name */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Forward control for the funnel, paired with BackButton in the header.
 *
 * This is the old skip control. It used to float over the avatar video with a
 * "Skip" label, which read as a way out of the video rather than a way through
 * the funnel, and it covered the video it sat on.
 *
 * The label is mirrored against BackButton, arrow trailing rather than leading,
 * and both drop to their arrows at the same width. That rule lives in
 * Header.module.css, on the row that owns both, so the two cannot drift apart.
 */
export function NextButton({
  onClick,
  label = "Next",
  disabled = false,
  className,
}: NextButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // The page wrapper listens for taps to unmute on mobile video steps, which
    // is every step this control appears on. Advancing is not a request for
    // sound, so don't let the click reach it.
    event.stopPropagation();
    onClick?.();
  };

  return (
    <button
      type="button"
      className={classNames(styles.nextButton, className)}
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      data-nav-button="next"
    >
      <span className={styles.label} data-nav-label>
        {label}
      </span>
      <ArrowRight size={20} weight="bold" color="#363534" aria-hidden="true" />
    </button>
  );
}
