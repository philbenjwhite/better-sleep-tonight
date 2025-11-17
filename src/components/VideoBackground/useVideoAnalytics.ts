/**
 * Video Analytics Hook
 *
 * Custom React hook for tracking video engagement metrics
 */

import { useEffect, useRef } from 'react';
import {
  trackVideoStart,
  trackVideoProgress,
  trackVideoComplete,
  trackVideoInteraction,
  trackVideoError,
  trackVideoLoadTime,
  type VideoTrackingConfig,
} from '@/lib/analytics';

export const useVideoAnalytics = (
  videoRef: React.RefObject<HTMLVideoElement>,
  config: VideoTrackingConfig
) => {
  const hasTrackedStart = useRef(false);
  const trackedMilestones = useRef(new Set<number>());
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    loadStartTime.current = Date.now();

    // Track video start
    const handlePlay = () => {
      if (!hasTrackedStart.current) {
        trackVideoStart(config);
        hasTrackedStart.current = true;
      }
    };

    // Track video progress
    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      if (duration > 0) {
        const percent = Math.floor((currentTime / duration) * 100);

        // Track milestones (25%, 50%, 75%)
        [25, 50, 75].forEach((milestone) => {
          if (percent >= milestone && !trackedMilestones.current.has(milestone)) {
            trackedMilestones.current.add(milestone);
            trackVideoProgress(config, currentTime, milestone);
          }
        });
      }
    };

    // Track video completion
    const handleEnded = () => {
      trackVideoComplete(config, video.currentTime);
    };

    // Track video errors
    const handleError = () => {
      const error = video.error;
      const errorMessage = error?.message || 'Unknown error';
      trackVideoError(config, 'playback_error', errorMessage);
    };

    // Track video load time
    const handleCanPlay = () => {
      const loadTime = Date.now() - loadStartTime.current;
      trackVideoLoadTime(config, loadTime);
    };

    // Attach event listeners
    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);

    // Cleanup
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoRef, config]);

  // Expose tracking methods for manual triggers
  return {
    trackPause: () => trackVideoInteraction(config, 'pause', videoRef.current?.currentTime),
    trackResume: () => trackVideoInteraction(config, 'resume', videoRef.current?.currentTime),
    trackSoundEnabled: () => trackVideoInteraction(config, 'sound_enabled'),
    trackSoundDisabled: () => trackVideoInteraction(config, 'sound_disabled'),
    trackReplay: () => trackVideoInteraction(config, 'replay'),
  };
};
