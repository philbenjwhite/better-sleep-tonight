"use client";

import classNames from "classnames";
import { ArrowLeft } from "@phosphor-icons/react";
import styles from "./BackButton.module.css";

export interface BackButtonProps {
  onClick?: () => void;
  /** Visible label; hidden on small screens, always kept as the accessible name */
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
    >
      <ArrowLeft size={20} weight="bold" color="#363534" aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
