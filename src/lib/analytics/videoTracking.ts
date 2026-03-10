/**
 * Video Analytics Tracking Utilities
 *
 * In production: fires gtag() events to GA4
 * In development: logs event payloads to console (no GA4 call)
 */

export interface VideoTrackingConfig {
  videoTitle: string;
  videoDuration: number;
  videoUrl: string;
}

const isProduction = process.env.NODE_ENV === 'production';

const fireEvent = (event: string, params: Record<string, any>): void => {
  if (isProduction && typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', event, params);
  } else if (!isProduction) {
    console.log(`[GA4 Event] ${event}`, params);
  }
};

export const trackVideoStart = (config: VideoTrackingConfig): void => {
  fireEvent('video_start', {
    event_category: 'Video',
    event_label: config.videoTitle,
    video_title: config.videoTitle,
    video_duration: config.videoDuration,
    video_url: config.videoUrl,
  });
};

export const trackVideoComplete = (config: VideoTrackingConfig, watchTime: number): void => {
  fireEvent('video_complete', {
    event_category: 'Video',
    event_label: config.videoTitle,
    video_title: config.videoTitle,
    video_duration: config.videoDuration,
    video_current_time: watchTime,
    video_url: config.videoUrl,
  });
};
