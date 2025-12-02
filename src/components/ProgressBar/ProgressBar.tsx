'use client';

import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** Current step (1-indexed) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Optional class name */
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  const targetProgress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const [displayProgress, setDisplayProgress] = useState(0);

  // Animate to target progress after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(targetProgress);
    }, 50);
    return () => clearTimeout(timer);
  }, [targetProgress]);

  return (
    <div className={classNames(styles.progressBar, className)}>
      <div
        className={styles.progressFill}
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
};
