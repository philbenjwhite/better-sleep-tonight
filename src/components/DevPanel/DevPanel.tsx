'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AVAILABLE_FLOWS } from '@/config';
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
  stepNames?: string[];
  stepIds?: string[];
  /** Callback when panel open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Current view - only auto-sync URL when in 'question' view */
  currentView?: 'intro' | 'question';
}

export const DevPanel: React.FC<DevPanelProps> = ({
  answers,
  currentStep,
  totalSteps,
  stepNames = [],
  stepIds = [],
  onOpenChange,
  currentView = 'intro',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const lastSyncedStepRef = useRef<number>(-1);

  // Notify parent when open state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Get current URL params
  const currentFlow = searchParams.get('flow') || 'default';
  const currentStepParam = searchParams.get('step');

  // Auto-sync URL with current step (only during natural flow progression in question view)
  useEffect(() => {
    // Only auto-sync when in question view (not on intro screen)
    if (currentView !== 'question') {
      return;
    }

    // Calculate what the step parameter should be (currentStep is 0-based index)
    // In question view: currentStep 0 = step 1, currentStep 1 = step 2, etc.
    const expectedStepParam = String(currentStep + 1);

    // Check if currentStep changed due to natural progression (not URL change)
    // If URL already matches currentStep, this was likely a URL-driven change, so skip sync
    const urlAlreadyMatches = currentStepParam === expectedStepParam;

    // Only sync if:
    // 1. URL doesn't match expected (out of sync)
    // 2. currentStep actually changed (not just re-render)
    if (!urlAlreadyMatches && lastSyncedStepRef.current !== currentStep) {
      lastSyncedStepRef.current = currentStep;
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('step', expectedStepParam);
      const queryString = newParams.toString();
      router.replace(queryString ? `/?${queryString}` : '/');
    } else if (urlAlreadyMatches) {
      // Update ref if URL already matches (sync from URL change)
      lastSyncedStepRef.current = currentStep;
    }
  }, [currentView, currentStep, currentStepParam, searchParams, router]);

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
      {/* Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h3 className={styles.title}>Dev Panel</h3>
            <p className={styles.currentStepText}>
              {currentStepParam ? `${currentStepParam}. ${stepNames[parseInt(currentStepParam, 10) - 1] || ''}` : 'Intro'}
            </p>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        <div className={styles.content}>
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
                  title={stepNames[step - 1] || `Step ${step}`}
                >
                  {step}. {stepNames[step - 1] || `Step ${step}`}
                </button>
              ))}
            </div>
          </div>

          {/* Stored answers */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              Collected Answers ({answers.length}/{totalSteps})
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

        </div>

        <div className={styles.footer}>
          <p className={styles.hint}>Press <kbd>/</kbd> to toggle</p>
        </div>
      </div>
    </>
  );
};
