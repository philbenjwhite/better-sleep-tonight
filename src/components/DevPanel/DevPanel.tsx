'use client';

import React, { useState, useEffect } from 'react';
import styles from './DevPanel.module.css';

export interface StoredAnswer {
  stepId: string;
  questionText: string;
  value: string;
  label: string;
  timestamp: Date;
}

export interface DevPanelProps {
  answers: StoredAnswer[];
  currentStep: number;
  totalSteps: number;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  answers,
  currentStep,
  totalSteps,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for "/" key to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Also close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>Dev Panel</h3>
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        <div className={styles.content}>
          {/* Progress info */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Progress</h4>
            <p className={styles.progressText}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Stored answers */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              Collected Answers ({answers.length})
            </h4>

            {answers.length === 0 ? (
              <p className={styles.emptyText}>No answers yet</p>
            ) : (
              <div className={styles.answersList}>
                {answers.map((answer, index) => (
                  <div key={answer.stepId} className={styles.answerItem}>
                    <div className={styles.answerNumber}>{index + 1}</div>
                    <div className={styles.answerContent}>
                      <p className={styles.answerQuestion}>{answer.questionText}</p>
                      <p className={styles.answerValue}>
                        <span className={styles.answerLabel}>{answer.label}</span>
                        <span className={styles.answerRaw}>({answer.value})</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON */}
          {answers.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Raw Data</h4>
              <pre className={styles.jsonOutput}>
                {JSON.stringify(
                  answers.map(a => ({ [a.stepId]: a.value })),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.hint}>Press <kbd>/</kbd> to toggle</p>
        </div>
      </div>
    </>
  );
};
