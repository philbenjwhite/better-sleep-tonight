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

// Track "Buy Now" click on product card
export const trackBuyNowClick = (productId: string, productName: string, price: number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'buy_now_click', {
      event_category: 'Ecommerce',
      event_label: productName,
      item_id: productId,
      item_name: productName,
      price: price,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Buy Now Click]', { productId, productName, price });
  }
};

// Track "Learn More" click on product card
export const trackLearnMoreClick = (productId: string, productName: string): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'learn_more_click', {
      event_category: 'Engagement',
      event_label: productName,
      item_id: productId,
      item_name: productName,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Learn More Click]', { productId, productName });
  }
};

// Track "Book a Rest Test" CTA click
export const trackBookRestTestIntent = (productId: string, productName: string, price: number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'book_rest_test_intent', {
      event_category: 'Engagement',
      event_label: productName,
      item_id: productId,
      item_name: productName,
      price: price,
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Book Rest Test Intent]', { productId, productName, price });
  }
};

// Track store search (zip code submission)
export const trackStoreSearch = (zipCode: string, resultsCount?: number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', 'store_search', {
      event_category: 'Engagement',
      event_label: zipCode,
      zip_code: zipCode,
      ...(resultsCount !== undefined && { results_count: resultsCount }),
    });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Store Search]', { zipCode, resultsCount });
  }
};
