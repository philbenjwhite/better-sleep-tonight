'use client';

import { useEffect, useRef } from 'react';
import { useSubtitleSync } from '@/hooks/useSubtitleSync';
import { getVttPathFromVideo } from '@/lib/subtitles';
import { SpeechBubbleSequence } from './SpeechBubbleSequence';
import styles from './SyncedSpeechBubble.module.css';

export interface SyncedSpeechBubbleProps {
  /** Video path - VTT path is derived by replacing extension */
  videoPath: string;
  /** Fallback message if VTT not available */
  fallbackMessage?: string;
  /** Called when all words have been shown */
  onComplete?: () => void;
  /** Keep visible after completion */
  stayVisible?: boolean;
  /** Optional class name */
  className?: string;
}

export function SyncedSpeechBubble({
  videoPath,
  fallbackMessage = '',
  onComplete,
  stayVisible = false,
  className,
}: SyncedSpeechBubbleProps) {
  const vttUrl = getVttPathFromVideo(videoPath);
  const hasCalledComplete = useRef(false);

  const { visibleCues, allCues, hasSubtitles, isLoading } = useSubtitleSync({
    vttUrl,
  });

  // Track completion
  useEffect(() => {
    if (
      hasSubtitles &&
      visibleCues.length === allCues.length &&
      allCues.length > 0 &&
      !hasCalledComplete.current
    ) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [visibleCues.length, allCues.length, hasSubtitles, onComplete]);

  // Reset completion tracking when video changes
  useEffect(() => {
    hasCalledComplete.current = false;
  }, [videoPath]);

  // Loading state - show nothing
  if (isLoading) {
    return null;
  }

  // No subtitles available - fall back to original component
  if (!hasSubtitles && fallbackMessage) {
    return (
      <SpeechBubbleSequence
        message={fallbackMessage}
        onComplete={onComplete}
        stayVisible={stayVisible}
        className={className}
      />
    );
  }

  // No subtitles and no fallback
  if (!hasSubtitles) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.bubble}>
        <p className={styles.text}>
          {allCues.map((cue, index) => {
            const isVisible = index < visibleCues.length;
            return (
              <span
                key={index}
                className={`${styles.word} ${isVisible ? styles.visible : ''}`}
              >
                {cue.text}{' '}
              </span>
            );
          })}
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
