'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SpeechBubbleSequence.module.css';

export interface SpeechBubbleSequenceProps {
  /** Full message text - paragraphs separated by double newlines */
  message: string;
  /** Delay between words in seconds */
  wordDelay?: number;
  /** Delay after paragraph completes before transitioning (ms) */
  paragraphPauseMs?: number;
  /** Called when all paragraphs have been shown */
  onComplete?: () => void;
  /** Optional class name for the container */
  className?: string;
}

export function SpeechBubbleSequence({
  message,
  wordDelay = 0.26,
  paragraphPauseMs = 1500,
  onComplete,
  className,
}: SpeechBubbleSequenceProps) {
  // Split message into paragraphs by double newline
  const paragraphs = message.split(/\n\n+/).filter(p => p.trim());

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentParagraph = paragraphs[currentParagraphIndex] || '';
  const words = currentParagraph.split(' ').filter(w => w);

  // Calculate when all words in current paragraph will be visible
  const totalAnimationTime = words.length * wordDelay * 1000;

  const advanceToNextParagraph = useCallback(() => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setIsTransitioning(true);

      // After slide-up animation, show next paragraph
      setTimeout(() => {
        setCurrentParagraphIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 400); // Match CSS transition duration
    } else {
      // All paragraphs shown
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentParagraphIndex, paragraphs.length, onComplete]);

  // Auto-advance after paragraph animation completes
  useEffect(() => {
    if (words.length === 0 || isTransitioning || isComplete) return;

    const timer = setTimeout(() => {
      advanceToNextParagraph();
    }, totalAnimationTime + paragraphPauseMs);

    return () => clearTimeout(timer);
  }, [words.length, totalAnimationTime, paragraphPauseMs, isTransitioning, isComplete, advanceToNextParagraph]);

  // Reset when message changes
  useEffect(() => {
    setCurrentParagraphIndex(0);
    setIsTransitioning(false);
    setIsComplete(false);
  }, [message]);

  if (isComplete || paragraphs.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div
        className={`${styles.bubble} ${isTransitioning ? styles.slideUp : styles.fadeIn}`}
        key={currentParagraphIndex}
      >
        <p className={styles.text}>
          {words.map((word, index) => (
            <span
              key={`${currentParagraphIndex}-${index}`}
              className={styles.word}
              style={{ animationDelay: `${index * wordDelay}s` }}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>

    </div>
  );
}
