/**
 * Conversion Tracking Utilities
 *
 * Tracks user actions that indicate conversion intent
 */

export interface ConversionEvent {
  event: string;
  eventCategory: string;
  eventLabel: string;
  value?: number;
  ctaPosition?: string;
  ctaText?: string;
  quizStep?: number;
  productId?: string;
  productName?: string;
}

// Track CTA clicks
export const trackCTAClick = (
  ctaText: string,
  ctaPosition: string = 'unknown',
  scrollDepth?: number
): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'cta_click', {
      event_category: 'Engagement',
      event_label: ctaText,
      cta_position: ctaPosition,
      cta_text: ctaText,
      page_scroll_depth: scrollDepth,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[CTA Click]', { ctaText, ctaPosition, scrollDepth });
  }
};

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

// Track email capture
export const trackEmailCapture = (source: string): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'email_captured', {
      event_category: 'Lead Generation',
      event_label: source,
      source: source,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Email Captured]', { source });
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

// Track add to cart
export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  quantity: number = 1
): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'add_to_cart', {
      event_category: 'Ecommerce',
      event_label: productName,
      value: price * quantity,
      currency: 'USD',
      items: [
        {
          item_id: productId,
          item_name: productName,
          price: price,
          quantity: quantity,
        },
      ],
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Add to Cart]', { productId, productName, price, quantity });
  }
};
