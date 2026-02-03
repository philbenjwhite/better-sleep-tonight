'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export interface FooterProps {
  /** Show progress bar above footer */
  showProgress?: boolean;
  /** Current step (1-indexed) for progress bar */
  currentStep?: number;
  /** Total number of steps for progress bar */
  totalSteps?: number;
  /** Show avatar section above footer content (mobile only) */
  showAvatarSection?: boolean;
  /** Video source for avatar */
  avatarVideoSrc?: string;
  /** Text to display next to avatar - supports paragraphs separated by double newlines */
  avatarText?: string;
  /** Controls audio mute state for the avatar video */
  isMuted?: boolean;
  /** Callback when user unmutes by tapping avatar */
  onUnmute?: () => void;
  /** Delay between words in seconds (default 0.15) */
  wordDelay?: number;
  /** Delay after paragraph completes before transitioning (ms, default 1500) */
  paragraphPauseMs?: number;
}

// Split text into paragraphs, preserving double newlines inside quotes
function splitIntoParagraphs(text: string): string[] {
  const paragraphs: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Track quote state
    if (char === '"' || char === '\u201C' || char === '\u201D' || char === "'" || char === '\u2018' || char === '\u2019') {
      inQuote = !inQuote;
      current += char;
      i++;
    }
    // Check for double newline (paragraph break)
    else if (!inQuote && text.slice(i, i + 2) === '\n\n') {
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
}

export function Footer({
  showProgress = false,
  currentStep = 0,
  totalSteps = 0,
  showAvatarSection = false,
  avatarVideoSrc,
  avatarText,
  isMuted = true,
  onUnmute,
  wordDelay = 0.26,
  paragraphPauseMs = 1500,
}: FooterProps) {
  const [isAvatarDismissed, setIsAvatarDismissed] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  // Sync video muted state with prop when it changes (e.g., global mute button)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Parse paragraphs from avatarText
  const paragraphs = avatarText ? splitIntoParagraphs(avatarText) : [];
  const currentParagraph = paragraphs[currentParagraphIndex] || '';
  const words = currentParagraph.split(' ').filter(w => w);

  // Calculate delay for punctuation
  const getWordDelay = useCallback((word: string): number => {
    const lastChar = word.trim().slice(-1);
    if (lastChar === '.' || lastChar === '!' || lastChar === '?') {
      return wordDelay * 2.0;
    }
    if (lastChar === ',' || lastChar === ';' || lastChar === ':') {
      return wordDelay * 1.5;
    }
    return wordDelay;
  }, [wordDelay]);

  // Calculate cumulative delay for each word
  const getCumulativeDelay = useCallback((wordIndex: number): number => {
    let totalDelay = 0;
    for (let i = 0; i < wordIndex; i++) {
      totalDelay += getWordDelay(words[i]);
    }
    return totalDelay;
  }, [words, getWordDelay]);

  // Total animation time for current paragraph
  const totalAnimationTime = words.reduce((total, word) => total + getWordDelay(word), 0) * 1000;

  // Advance to next paragraph
  const advanceToNextParagraph = useCallback(() => {
    if (currentParagraphIndex < paragraphs.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentParagraphIndex(prev => prev + 1);
        setIsTransitioning(false);
      }, 400);
    }
  }, [currentParagraphIndex, paragraphs.length]);

  // Auto-advance after paragraph animation completes
  useEffect(() => {
    if (words.length === 0 || isTransitioning || paragraphs.length <= 1) return;
    if (currentParagraphIndex >= paragraphs.length - 1) return;

    const timer = setTimeout(() => {
      advanceToNextParagraph();
    }, totalAnimationTime + paragraphPauseMs);

    return () => clearTimeout(timer);
  }, [words.length, totalAnimationTime, paragraphPauseMs, isTransitioning, currentParagraphIndex, paragraphs.length, advanceToNextParagraph]);

  // Reset when avatarText changes
  useEffect(() => {
    setCurrentParagraphIndex(0);
    setIsTransitioning(false);
  }, [avatarText]);

  const handleDismiss = () => {
    setIsSliding(true);
    // After animation completes, fully hide the element
    setTimeout(() => {
      setIsAvatarDismissed(true);
    }, 300); // Match CSS transition duration
  };

  const handleVideoEnded = () => {
    handleDismiss();
  };

  const handleAvatarTap = () => {
    if (isMuted && videoRef.current) {
      videoRef.current.muted = false;
      onUnmute?.();
    }
  };

  return (
    <footer className={`${styles.footer} ${!showProgress ? styles.footerStatic : ''}`}>
      {/* Avatar section renders above progress bar (mobile only via CSS) */}
      {showAvatarSection && avatarVideoSrc && !isAvatarDismissed && (
        <div className={`${styles.avatarSection} ${isSliding ? styles.avatarSlideOut : ''}`}>
          <button
            type="button"
            className={styles.avatarDismissButton}
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <video
            ref={videoRef}
            className={styles.avatarVideo}
            src={avatarVideoSrc}
            autoPlay
            playsInline
            muted={isMuted}
            onEnded={handleVideoEnded}
            onClick={handleAvatarTap}
          />
          {words.length > 0 && (
            <p
              className={`${styles.avatarText} ${isTransitioning ? styles.textSlideUp : styles.textFadeIn}`}
              key={currentParagraphIndex}
            >
              <span className={styles.quoteOpen}>&ldquo;</span>
              {words.map((word, index) => (
                <span
                  key={`${currentParagraphIndex}-${index}`}
                  className={styles.word}
                  style={{ animationDelay: `${getCumulativeDelay(index)}s` }}
                >
                  {word}{' '}
                </span>
              ))}
              <span className={styles.quoteClose}>&rdquo;</span>
            </p>
          )}
        </div>
      )}
      {showProgress && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className={styles.footerContent}>
        <p className={styles.copyright}>
          © 2025 BetterSleep Tonight. All rights reserved.
        </p>
        <Link href="/privacy-policy" className={styles.privacyPolicy}>
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
