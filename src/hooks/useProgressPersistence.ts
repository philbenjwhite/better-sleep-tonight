'use client';

import { useCallback, useEffect, useState } from 'react';
import { StoredAnswer } from '@/components/DevPanel';

const STORAGE_KEY = 'bettersleep_progress';
const EXPIRATION_DAYS = 7;

export interface SavedProgress {
  flowId: string;
  currentStepIndex: number;
  answers: StoredAnswer[];
  lastUpdated: string;
}

interface UseProgressPersistenceReturn {
  savedProgress: SavedProgress | null;
  hasSavedProgress: boolean;
  saveProgress: (progress: Omit<SavedProgress, 'lastUpdated'>) => void;
  clearProgress: () => void;
  isLoading: boolean;
}

/**
 * Hook for persisting questionnaire progress to localStorage
 * Handles save, load, and expiration of progress data
 */
export function useProgressPersistence(): UseProgressPersistenceReturn {
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedProgress = JSON.parse(stored);

        // Check if progress has expired
        const lastUpdated = new Date(parsed.lastUpdated);
        const now = new Date();
        const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate > EXPIRATION_DAYS) {
          // Progress expired, clear it
          localStorage.removeItem(STORAGE_KEY);
          setSavedProgress(null);
        } else {
          // Restore Date objects for timestamps
          parsed.answers = parsed.answers.map(answer => ({
            ...answer,
            timestamp: new Date(answer.timestamp)
          }));
          setSavedProgress(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((progress: Omit<SavedProgress, 'lastUpdated'>) => {
    try {
      const progressWithTimestamp: SavedProgress = {
        ...progress,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressWithTimestamp));
      setSavedProgress(progressWithTimestamp);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, []);

  // Clear progress from localStorage
  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSavedProgress(null);
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }, []);

  return {
    savedProgress,
    hasSavedProgress: savedProgress !== null && savedProgress.answers.length > 0,
    saveProgress,
    clearProgress,
    isLoading
  };
}
