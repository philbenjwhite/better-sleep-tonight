/**
 * Conversion Tracking Utilities
 *
 * In production: fires gtag() events to GA4
 * In development: logs event payloads to console (no GA4 call)
 */

const isProduction = process.env.NODE_ENV === 'production';

const fireEvent = (event: string, params: Record<string, any>): void => {
  if (isProduction && typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', event, params);
  } else if (!isProduction) {
    console.log(`[GA4 Event] ${event}`, params);
  }
};

// Track quiz interactions
export const trackQuizEvent = (
  eventType: 'quiz_start' | 'quiz_step' | 'quiz_complete',
  step?: number,
  data?: Record<string, any>
): void => {
  fireEvent(eventType, {
    event_category: 'Quiz',
    event_label: eventType,
    quiz_step: step,
    ...data,
  });
};

// Track "Buy Now" click on product card
export const trackBuyNowClick = (productId: string, productName: string, price: number): void => {
  fireEvent('buy_now_click', {
    event_category: 'Ecommerce',
    event_label: productName,
    item_id: productId,
    item_name: productName,
    price: price,
  });
};

// Track "Learn More" click on product card
export const trackLearnMoreClick = (productId: string, productName: string): void => {
  fireEvent('learn_more_click', {
    event_category: 'Engagement',
    event_label: productName,
    item_id: productId,
    item_name: productName,
  });
};

// Track "Book a Rest Test" CTA click
export const trackBookRestTestIntent = (productId: string, productName: string, price: number): void => {
  fireEvent('book_rest_test_intent', {
    event_category: 'Engagement',
    event_label: productName,
    item_id: productId,
    item_name: productName,
    price: price,
  });
};

// Track Google Ads form submission conversion (TSI Rest Test)
export const trackFormSubmissionConversion = (): void => {
  fireEvent('conversion', { send_to: 'AW-952158342/ZQuYCJ35mYYcEIaRg8YD' });
};

// Track store search (zip code submission)
export const trackStoreSearch = (zipCode: string, resultsCount?: number): void => {
  fireEvent('store_search', {
    event_category: 'Engagement',
    event_label: zipCode,
    zip_code: zipCode,
    ...(resultsCount !== undefined && { results_count: resultsCount }),
  });
};
