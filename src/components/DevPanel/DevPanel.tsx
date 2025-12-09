'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './DevPanel.module.css';

export interface StoredAnswer {
  stepId: string;
  questionText: string;
  value: string;
  label: string;
  timestamp: Date;
}

// Available flows - should match FLOWS in page.tsx
const AVAILABLE_FLOWS = [
  { id: 'default', label: 'Default (Sleep)' },
  { id: 'sleep', label: 'Wake Up Rested' },
  { id: 'back-pain', label: 'Back Pain' },
  { id: 'achesandpains', label: 'Aches & Pains' },
  { id: 'wakeupwithaheadache', label: 'Headache' },
  { id: 'hippain', label: 'Hip Pain' },
  { id: 'wakeupfeelingtired', label: 'Feeling Tired' },
  { id: 'neckpain', label: 'Neck Pain' },
  { id: 'shoulderpain', label: 'Shoulder Pain' },
];

export interface DevPanelProps {
  answers: StoredAnswer[];
  currentStep: number;
  totalSteps: number;
  currentEmotion?: string;
  sessionEmotion?: string;
}

export const DevPanel: React.FC<DevPanelProps> = ({
  answers,
  currentStep,
  totalSteps,
  currentEmotion,
  sessionEmotion = 'friendly',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current URL params
  const currentFlow = searchParams.get('flow') || 'default';
  const currentStepParam = searchParams.get('step');

  // Navigate to a URL with updated params
  const navigateWithParams = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    const queryString = newParams.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  }, [searchParams, router]);

  // Flow selection handler
  const handleFlowChange = useCallback((flowId: string) => {
    navigateWithParams({
      flow: flowId === 'default' ? null : flowId,
      step: null // Reset step when changing flow
    });
  }, [navigateWithParams]);

  // Step navigation handlers
  const handleStepChange = useCallback((step: number | null) => {
    navigateWithParams({
      step: step === null ? null : String(step)
    });
  }, [navigateWithParams]);

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
          {/* Flow Selection */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Flow Variant</h4>
            <div className={styles.buttonGroup}>
              {AVAILABLE_FLOWS.map((flow) => (
                <button
                  key={flow.id}
                  className={`${styles.flowButton} ${currentFlow === flow.id ? styles.flowButtonActive : ''}`}
                  onClick={() => handleFlowChange(flow.id)}
                >
                  {flow.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step Navigation */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Jump to Step</h4>
            <div className={styles.stepNav}>
              <button
                className={`${styles.stepButton} ${!currentStepParam ? styles.stepButtonActive : ''}`}
                onClick={() => handleStepChange(null)}
              >
                Intro
              </button>
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <button
                  key={step}
                  className={`${styles.stepButton} ${currentStepParam === String(step) ? styles.stepButtonActive : ''}`}
                  onClick={() => handleStepChange(step)}
                >
                  {step}
                </button>
              ))}
            </div>
            <p className={styles.stepHint}>
              Current: {currentStepParam ? `Step ${currentStepParam}` : 'Intro'}
            </p>
          </div>

          {/* Progress info */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Progress</h4>
            <p className={styles.progressText}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Avatar Emotion */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Avatar Emotion</h4>
            <div className={styles.emotionInfo}>
              <p className={styles.emotionRow}>
                <span className={styles.emotionLabel}>Session:</span>
                <span className={styles.emotionValue}>{sessionEmotion}</span>
              </p>
              {currentEmotion && (
                <p className={styles.emotionRow}>
                  <span className={styles.emotionLabel}>CMS Value:</span>
                  <span className={styles.emotionValue}>{currentEmotion}</span>
                </p>
              )}
              <p className={styles.emotionNote}>
                Note: HeyGen SDK only supports setting emotion at session start, not per-speak call.
              </p>
            </div>
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
