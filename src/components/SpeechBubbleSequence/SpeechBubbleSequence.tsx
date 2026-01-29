'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SpeechBubbleSequence.module.css';

export interface SubtitleCue {
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

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
  /** VTT subtitle cues - when provided, uses video time for paragraph transitions */
  subtitleCues?: SubtitleCue[];
  /** Current video playback time in seconds - required when subtitleCues is provided */
  videoCurrentTime?: number;
  /** Optional CTA button text to show after text animation completes */
  ctaButtonText?: string;
  /** Called when CTA button is clicked */
  onCtaClick?: () => void;
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
  subtitleCues,
  videoCurrentTime,
  ctaButtonText,
  onCtaClick,
}: SpeechBubbleSequenceProps) {
  // Determine if we're in video-synced mode
  const isVideoSyncMode = subtitleCues && subtitleCues.length > 0 && videoCurrentTime !== undefined;

  // Split message into paragraphs, preserving double newlines inside quotes
  const splitIntoParagraphs = (text: string): string[] => {
    const paragraphs: string[] = [];
    let current = '';
    let inQuote = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      // Track quote state (handle double quotes " " " and single quotes ' ' ')
      // Using Unicode: " = \u201C, " = \u201D, ' = \u2018, ' = \u2019
      if (char === '"' || char === '\u201C' || char === '\u201D' || char === "'" || char === '\u2018' || char === '\u2019') {
        inQuote = !inQuote;
        current += char;
        i++;
      }
      // Check for double newline (paragraph break)
      else if (!inQuote && text.slice(i, i + 2) === '\n\n') {
        // Skip all consecutive newlines
        if (current.trim()) {
          paragraphs.push(current.trim());
        }
        current = '';
        while (i < text.length && text[i] === '\n') {
          i++;
        }
      }
      else {
        current += char;
        i++;
      }
    }

    // Add final paragraph
    if (current.trim()) {
      paragraphs.push(current.trim());
    }

    return paragraphs;
  };

  // In video-sync mode, use cue texts as paragraphs; otherwise split preserving quotes
  const paragraphs = isVideoSyncMode
    ? subtitleCues!.map(cue => cue.text)
    : splitIntoParagraphs(message);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [lastShownCueIndex, setLastShownCueIndex] = useState(-1);
  const [showCtaButton, setShowCtaButton] = useState(false);

  // In video-sync mode, determine current cue based on video time
  // Find the most recent cue that has started (handles gaps between cues)
  const videoCueIndex = isVideoSyncMode
    ? (() => {
        // If video time is very early (< 1 second), always start from first cue
        // This prevents jumping to a later cue if video loads with non-zero time
        if (videoCurrentTime! < 1 && subtitleCues!.length > 0) {
          return 0;
        }

        let lastMatchingIndex = -1;
        for (let i = 0; i < subtitleCues!.length; i++) {
          if (videoCurrentTime! >= subtitleCues![i].startTime) {
            lastMatchingIndex = i;
          } else {
            break; // Cues are in order, no need to check further
          }
        }
        return lastMatchingIndex;
      })()
    : -1;

  // Handle cue transitions in video-sync mode
  useEffect(() => {
    if (!isVideoSyncMode || videoCueIndex < 0) return;

    console.log('[SpeechBubble] videoCueIndex:', videoCueIndex, 'lastShownCueIndex:', lastShownCueIndex, 'videoCurrentTime:', videoCurrentTime);

    // If we've moved to a new cue (or showing first cue)
    if (videoCueIndex !== lastShownCueIndex) {
      // Trigger transition animation if not the first cue
      if (lastShownCueIndex >= 0 && videoCueIndex > lastShownCueIndex) {
        console.log('[SpeechBubble] Transitioning to cue:', videoCueIndex);
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentParagraphIndex(videoCueIndex);
          setLastShownCueIndex(videoCueIndex);
          setIsTransitioning(false);
        }, 400); // Match CSS transition duration
      } else {
        // First cue or backward seek - no transition needed
        console.log('[SpeechBubble] Setting cue without transition:', videoCueIndex);
        setCurrentParagraphIndex(videoCueIndex);
        setLastShownCueIndex(videoCueIndex);
      }
    }

    // Check if we've completed all cues
    if (videoCueIndex === subtitleCues!.length - 1) {
      const lastCue = subtitleCues![videoCueIndex];
      if (videoCurrentTime! >= lastCue.endTime) {
        setIsComplete(true);
        onComplete?.();
      }
    }
  }, [isVideoSyncMode, videoCueIndex, lastShownCueIndex, subtitleCues, videoCurrentTime, onComplete]);

  const currentParagraph = paragraphs[currentParagraphIndex] || '';
  const words = currentParagraph.split(' ').filter(w => w);

  // In video-sync mode, calculate dynamic word delay based on cue duration
  // This ensures all words animate within the time the cue is displayed
  const currentCue = isVideoSyncMode && videoCueIndex >= 0 ? subtitleCues![videoCueIndex] : null;
  const cueDuration = currentCue ? currentCue.endTime - currentCue.startTime : 0;

  // Calculate effective word delay for video-sync mode
  // Reserve 15% of time at end for reading, distribute rest across words
  const effectiveWordDelay = isVideoSyncMode && words.length > 0 && cueDuration > 0
    ? (cueDuration * 0.85) / words.length
    : wordDelay;

  // Calculate delay for a word based on punctuation
  // Only apply sentence-end delays when punctuation is truly at the end (not inside quotes)
  const getWordDelay = useCallback((word: string): number => {
    // In video-sync mode, use uniform timing to fit within cue duration
    if (isVideoSyncMode) {
      return effectiveWordDelay;
    }

    const trimmedWord = word.trim();
    // Get the last character(s) to check punctuation
    const lastChar = trimmedWord.slice(-1);

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
  }, [isVideoSyncMode, effectiveWordDelay, wordDelay, commaDelayMultiplier, sentenceEndDelayMultiplier]);

  // Calculate cumulative delays for each word
  const getCumulativeDelay = useCallback((wordIndex: number): number => {
    // In video-sync mode, use simple linear timing
    if (isVideoSyncMode) {
      return wordIndex * effectiveWordDelay;
    }

    let totalDelay = 0;
    for (let i = 0; i < wordIndex; i++) {
      totalDelay += getWordDelay(words[i]);
    }
    return totalDelay;
  }, [isVideoSyncMode, effectiveWordDelay, words, getWordDelay]);

  // Calculate total animation time accounting for punctuation delays
  const totalAnimationTime = words.reduce((total, word) => total + getWordDelay(word), 0) * 1000;

  // Show CTA button after text animation completes (only on last paragraph)
  useEffect(() => {
    if (!ctaButtonText || currentParagraphIndex !== paragraphs.length - 1 || isTransitioning) return;

    const timer = setTimeout(() => {
      setShowCtaButton(true);
    }, totalAnimationTime + 300); // Small delay after text finishes

    return () => clearTimeout(timer);
  }, [ctaButtonText, currentParagraphIndex, paragraphs.length, isTransitioning, totalAnimationTime]);

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

  // Auto-advance after paragraph animation completes (timer-based mode only)
  useEffect(() => {
    // Skip timer-based advancement in video-sync mode
    if (isVideoSyncMode) return;
    if (words.length === 0 || isTransitioning || isComplete) return;

    const timer = setTimeout(() => {
      advanceToNextParagraph();
    }, totalAnimationTime + paragraphPauseMs);

    return () => clearTimeout(timer);
  }, [isVideoSyncMode, words.length, totalAnimationTime, paragraphPauseMs, isTransitioning, isComplete, advanceToNextParagraph]);

  // Reset when message changes
  useEffect(() => {
    setCurrentParagraphIndex(0);
    setIsTransitioning(false);
    setIsComplete(false);
    setLastShownCueIndex(-1);
    setShowCtaButton(false);
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

        {/* CTA Button - shown after text animation on last paragraph */}
        {ctaButtonText && showCtaButton && (
          <button
            type="button"
            className={styles.ctaButton}
            onClick={onCtaClick}
          >
            <span>{ctaButtonText}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.16669 10H15.8334M15.8334 10L10 4.16669M15.8334 10L10 15.8334"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <img
          src="/images/chat-bubble-tail.svg"
          alt=""
          className={styles.tail}
        />
      </div>

    </div>
  );
}
