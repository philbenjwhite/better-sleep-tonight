"use client";

import classNames from "classnames";
import { ArrowLeft } from "@phosphor-icons/react";
import styles from "./BackButton.module.css";

export interface BackButtonProps {
  onClick?: () => void;
  /** Visible label; hidden at tablet widths, always kept as the accessible name */
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function BackButton({
  onClick,
  label = "Back",
  disabled = false,
  className,
}: BackButtonProps) {
  return (
    <button
      type="button"
      className={classNames(styles.backButton, className)}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      data-nav-button="back"
    >
      <ArrowLeft size={20} weight="bold" color="#363534" aria-hidden="true" />
      <span className={styles.label} data-nav-label>
        {label}
      </span>
    </button>
  );
}
