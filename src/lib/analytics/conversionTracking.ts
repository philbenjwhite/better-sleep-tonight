/**
 * Conversion Tracking Utilities
 *
 * In production: fires gtag() events to GA4
 * In development: logs event payloads to console (no GA4 call)
 */

const isProduction = process.env.NODE_ENV === 'production';

const fireEvent = (event: string, params: Record<string, any>): void => {
  if (isProduction && typeof window !== 'undefined') {
    // Push to dataLayer for GTM — GTM tags handle forwarding to GA4.
    // Do NOT also call gtag() here; that double-fires every event.
    const dataLayer = ((window as any).dataLayer = (window as any).dataLayer || []);
    dataLayer.push({ event, ...params });
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

// Track a step-back. Reported separately from quiz_step so backwards moves do
// not inflate forward step counts in GA4.
export const trackQuizBack = (
  fromStep: number,
  toStep: number,
  data?: Record<string, any>
): void => {
  fireEvent('quiz_step_back', {
    event_category: 'Quiz',
    event_label: 'quiz_step_back',
    quiz_step: toStep,
    from_step: fromStep,
    ...data,
  });
};

// Note: buy_now_click and learn_more_click were retired when the funnel moved to
// in-store rest tests only. Their GTM tags should stay paused so reporting is not
// skewed by dead events.

// Track "Book a Rest Test" CTA click — fires once per click, even when
// multiple mattresses are recommended. Shown products are bundled into
// the `items` array so per-product data is preserved.
export const trackBookRestTestIntent = (
  products: Array<{ id: string; productName: string; price: number }>
): void => {
  fireEvent('book_rest_test_intent', {
    event_category: 'Engagement',
    event_label: products.map((p) => p.productName).join(', '),
    item_count: products.length,
    items: products.map((p) => ({
      item_id: p.id,
      item_name: p.productName,
      price: p.price,
    })),
  });
};

// Track Google Ads form submission conversion (TSI Rest Test)
export const trackFormSubmissionConversion = (): void => {
  fireEvent('conversion', { send_to: 'AW-952158342/ZQuYCJ35mYYcEIaRg8YD' });
};

// Note: store_search fired when the funnel asked for a postal code. That step
// was removed in August 2026, so the event no longer exists.
