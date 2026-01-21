'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SpeechBubbleSequence.module.css';

export interface SpeechBubbleSequenceProps {
  /** Full message text - paragraphs separated by double newlines */
  message: string;
  /** Delay between words in seconds */
  wordDelay?: number;
  /** Extra delay multiplier for words ending with comma (default 1.5) */
  commaDelayMultiplier?: number;
  /** Extra delay multiplier for words ending with period/exclamation/question (default 2.0) */
  sentenceEndDelayMultiplier?: number;
  /** Delay after paragraph completes before transitioning (ms) */
  paragraphPauseMs?: number;
  /** Called when all paragraphs have been shown */
  onComplete?: () => void;
  /** Optional class name for the container */
  className?: string;
  /** Keep the bubble visible after animation completes (parent controls hiding) */
  stayVisible?: boolean;
}

export function SpeechBubbleSequence({
  message,
  wordDelay = 0.26,
  commaDelayMultiplier = 1.5,
  sentenceEndDelayMultiplier = 2.0,
  paragraphPauseMs = 1500,
  onComplete,
  className,
  stayVisible = false,
}: SpeechBubbleSequenceProps) {
  // Split message into paragraphs by double newline
  const paragraphs = message.split(/\n\n+/).filter(p => p.trim());

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentParagraph = paragraphs[currentParagraphIndex] || '';
  const words = currentParagraph.split(' ').filter(w => w);

  // Calculate delay for a word based on punctuation
  // Only apply sentence-end delays when punctuation is truly at the end (not inside quotes)
  const getWordDelay = useCallback((word: string): number => {
    const trimmedWord = word.trim();
    // Get the last character(s) to check punctuation
    const lastChar = trimmedWord.slice(-1);
    const lastTwoChars = trimmedWord.slice(-2);

    // Check if punctuation is followed by a closing quote (means it's inside a quote, not sentence end)
    const endsWithQuotedPunctuation = /[.!?]["'"'»]$/.test(trimmedWord);

    // Sentence-ending punctuation (but not if inside quotes)
    if (!endsWithQuotedPunctuation && (lastChar === '.' || lastChar === '!' || lastChar === '?')) {
      return wordDelay * sentenceEndDelayMultiplier;
    }
    // Quoted sentence end followed by closing quote - treat as minor pause, not full sentence end
    if (endsWithQuotedPunctuation) {
      return wordDelay * commaDelayMultiplier;
    }
    // Comma and other mid-sentence pauses
    if (lastChar === ',' || lastChar === ';' || lastChar === ':') {
      return wordDelay * commaDelayMultiplier;
    }
    return wordDelay;
  }, [wordDelay, commaDelayMultiplier, sentenceEndDelayMultiplier]);

  // Calculate cumulative delays for each word
  const getCumulativeDelay = useCallback((wordIndex: number): number => {
    let totalDelay = 0;
    for (let i = 0; i < wordIndex; i++) {
      totalDelay += getWordDelay(words[i]);
    }
    return totalDelay;
  }, [words, getWordDelay]);

  // Calculate total animation time accounting for punctuation delays
  const totalAnimationTime = words.reduce((total, word) => total + getWordDelay(word), 0) * 1000;

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

  // Hide component when complete (unless stayVisible is true)
  // Always hide if there are no paragraphs to show
  if (paragraphs.length === 0) {
    return null;
  }

  if (isComplete && !stayVisible) {
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
              style={{ animationDelay: `${getCumulativeDelay(index)}s` }}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>

    </div>
  );
}
