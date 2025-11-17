/**
 * Video Analytics Tracking Utilities
 *
 * Provides comprehensive tracking for video engagement metrics
 * including playback events, scroll depth, and user interactions.
 */

// Type definitions
export interface VideoTrackingConfig {
  videoTitle: string;
  videoDuration: number;
  videoUrl: string;
  autoPlay?: boolean;
}

export interface VideoEngagementEvent {
  event: string;
  eventCategory: string;
  eventLabel: string;
  value?: number;
  videoTitle?: string;
  videoDuration?: number;
  videoCurrentTime?: number;
  videoPercent?: number;
  videoProvider?: string;
  videoUrl?: string;
}

// Track video events to analytics
export const trackVideoEvent = (params: VideoEngagementEvent): void => {
  // Google Analytics 4
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', params.event, {
      event_category: params.eventCategory,
      event_label: params.eventLabel,
      value: params.value,
      video_title: params.videoTitle,
      video_duration: params.videoDuration,
      video_current_time: params.videoCurrentTime,
      video_percent: params.videoPercent,
      video_provider: params.videoProvider || 'self-hosted',
      video_url: params.videoUrl,
    });
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Video Analytics]', params);
  }

  // Add custom analytics platforms here
  // Example: Mixpanel, Segment, etc.
};

// Track video start
export const trackVideoStart = (config: VideoTrackingConfig): void => {
  trackVideoEvent({
    event: 'video_start',
    eventCategory: 'Video',
    eventLabel: config.videoTitle,
    videoTitle: config.videoTitle,
    videoDuration: config.videoDuration,
    videoUrl: config.videoUrl,
  });
};

// Track video progress milestones
export const trackVideoProgress = (
  config: VideoTrackingConfig,
  currentTime: number,
  percent: number
): void => {
  // Track at 25%, 50%, 75% milestones
  const milestones = [25, 50, 75];

  if (milestones.includes(percent)) {
    trackVideoEvent({
      event: `video_${percent}_percent`,
      eventCategory: 'Video',
      eventLabel: config.videoTitle,
      value: percent,
      videoTitle: config.videoTitle,
      videoDuration: config.videoDuration,
      videoCurrentTime: currentTime,
      videoPercent: percent,
      videoUrl: config.videoUrl,
    });
  }
};

// Track video completion
export const trackVideoComplete = (config: VideoTrackingConfig, watchTime: number): void => {
  trackVideoEvent({
    event: 'video_complete',
    eventCategory: 'Video',
    eventLabel: config.videoTitle,
    videoTitle: config.videoTitle,
    videoDuration: config.videoDuration,
    videoCurrentTime: watchTime,
    videoPercent: 100,
    videoUrl: config.videoUrl,
  });
};

// Track user interactions with video
export const trackVideoInteraction = (
  config: VideoTrackingConfig,
  interactionType: 'pause' | 'resume' | 'sound_enabled' | 'sound_disabled' | 'replay',
  currentTime?: number
): void => {
  trackVideoEvent({
    event: `video_${interactionType}`,
    eventCategory: 'Video',
    eventLabel: config.videoTitle,
    videoTitle: config.videoTitle,
    videoDuration: config.videoDuration,
    videoCurrentTime: currentTime,
    videoUrl: config.videoUrl,
  });
};

// Track video errors
export const trackVideoError = (
  config: VideoTrackingConfig,
  errorType: string,
  errorMessage?: string
): void => {
  trackVideoEvent({
    event: 'video_error',
    eventCategory: 'Video',
    eventLabel: `${config.videoTitle} - ${errorType}`,
    videoTitle: config.videoTitle,
    videoUrl: config.videoUrl,
  });

  // Also log to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    console.error('[Video Error]', errorType, errorMessage);
  }
};

// Track video load time
export const trackVideoLoadTime = (
  config: VideoTrackingConfig,
  loadTimeMs: number
): void => {
  trackVideoEvent({
    event: 'video_load_time',
    eventCategory: 'Video Performance',
    eventLabel: config.videoTitle,
    value: loadTimeMs,
    videoTitle: config.videoTitle,
    videoUrl: config.videoUrl,
  });
};
