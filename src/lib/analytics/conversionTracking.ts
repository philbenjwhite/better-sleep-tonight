/**
 * Conversion Tracking Utilities
 *
 * Tracks user actions that indicate conversion intent
 */

// Track quiz interactions
export const trackQuizEvent = (
  eventType: 'quiz_start' | 'quiz_step' | 'quiz_complete',
  step?: number,
  data?: Record<string, any>
): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', eventType, {
      event_category: 'Quiz',
      event_label: eventType,
      quiz_step: step,
      ...data,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Quiz Event]', { eventType, step, data });
  }
};

// Track product views
export const trackProductView = (productId: string, productName: string): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'view_item', {
      event_category: 'Ecommerce',
      event_label: productName,
      items: [
        {
          item_id: productId,
          item_name: productName,
        },
      ],
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Product View]', { productId, productName });
  }
};
