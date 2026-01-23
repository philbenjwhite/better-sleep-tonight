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
}: SpeechBubbleSequenceProps) {
  // Determine if we're in video-synced mode
  const isVideoSyncMode = subtitleCues && subtitleCues.length > 0 && videoCurrentTime !== undefined;

  // In video-sync mode, use cue texts as paragraphs; otherwise split by double newline
  const paragraphs = isVideoSyncMode
    ? subtitleCues!.map(cue => cue.text)
    : message.split(/\n\n+/).filter(p => p.trim());

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [lastShownCueIndex, setLastShownCueIndex] = useState(-1);

  // In video-sync mode, determine current cue based on video time
  const videoCueIndex = isVideoSyncMode
    ? subtitleCues!.findIndex(
        (cue, index) =>
          videoCurrentTime! >= cue.startTime &&
          (index === subtitleCues!.length - 1 || videoCurrentTime! < subtitleCues![index + 1].startTime)
      )
    : -1;

  // Handle cue transitions in video-sync mode
  useEffect(() => {
    if (!isVideoSyncMode || videoCueIndex < 0) return;

    // If we've moved to a new cue
    if (videoCueIndex !== lastShownCueIndex && videoCueIndex > lastShownCueIndex) {
      // Trigger transition animation if not the first cue
      if (lastShownCueIndex >= 0) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentParagraphIndex(videoCueIndex);
          setLastShownCueIndex(videoCueIndex);
          setIsTransitioning(false);
        }, 400); // Match CSS transition duration
      } else {
        // First cue - no transition needed
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
        <img
          src="/images/chat-bubble-tail.svg"
          alt=""
          className={styles.tail}
        />
      </div>

    </div>
  );
}
