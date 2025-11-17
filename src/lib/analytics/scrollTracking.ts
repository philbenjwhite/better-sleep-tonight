/**
 * Scroll Depth Tracking Utilities
 *
 * Tracks user scroll behavior to understand content engagement
 */

export interface ScrollDepthEvent {
  depth: number;
  label: string;
}

// Track scroll depth
export const trackScrollDepth = (depth: number, label?: string): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'scroll_depth', {
      event_category: 'Engagement',
      event_label: label || `${depth}% scrolled`,
      value: depth,
      scroll_depth: depth,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Scroll Analytics]', { depth, label });
  }
};

// Custom hook for tracking scroll depth
export const useScrollDepthTracking = (
  thresholds: number[] = [25, 50, 75, 90, 100]
) => {
  if (typeof window === 'undefined') return;

  const trackedThresholds = new Set<number>();

  const handleScroll = () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    thresholds.forEach((threshold) => {
      if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
        trackedThresholds.add(threshold);
        trackScrollDepth(threshold);
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
};
