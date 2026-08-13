"use client";

import classNames from "classnames";
import { ArrowRight } from "@phosphor-icons/react";
import styles from "./NextButton.module.css";

export interface NextButtonProps {
  onClick?: () => void;
  /** Visible label, and the accessible name */
  label?: string;
  /**
   * Ghost is for getting past something the user has not acted on — a segment
   * still playing. Primary is for carrying a decision forward, and is styled to
   * be the obvious thing to press.
   */
  variant?: "ghost" | "primary";
  disabled?: boolean;
  className?: string;
}

/**
 * Forward control for the funnel, paired with BackButton in the footer bar.
 *
 * It used to float over the avatar video, which read as a way out of the video
 * rather than a way through the funnel, and it covered the video it sat on.
 * Then it moved to the header, where at narrow widths it pinned to the edge of
 * the viewport and landed on the answer options.
 *
 * In the footer it is in the layout rather than over it, and it can afford to
 * say what it does: "Skip" while a segment plays, "Next" once there is an
 * answer to carry forward.
 */
export function NextButton({
  onClick,
  label = "Next",
  variant = "ghost",
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
      className={classNames(
        styles.nextButton,
        variant === "primary" && styles.primary,
        className,
      )}
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      data-nav-button="next"
      data-nav-variant={variant}
    >
      <span className={styles.label} data-nav-label>
        {label}
      </span>
      <ArrowRight size={20} weight="bold" color="currentColor" aria-hidden="true" />
    </button>
  );
}
