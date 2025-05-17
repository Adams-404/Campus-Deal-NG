
/**
 * Google Analytics utility functions
 */

/**
 * Track a custom event
 * 
 * @param eventName - The name of the event to track
 * @param eventParams - Optional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track a page view event
 * 
 * @param pageTitle - The title of the page
 * @param pagePath - The path of the page (defaults to current path)
 */
export const trackPageView = (pageTitle?: string, pagePath?: string) => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageTitle || document.title,
      page_location: window.location.href,
      page_path: pagePath || window.location.pathname
    });
  }
};

/**
 * Track a user action
 * 
 * @param action - The action the user performed
 * @param category - The category of the action
 * @param label - Optional label for the action
 * @param value - Optional value for the action
 */
export const trackUserAction = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value: value
  });
};

/**
 * Enhanced scroll tracking to monitor content engagement
 * 
 * @param scrollDepth - Percentage of page scrolled (25, 50, 75, 90)
 * @param pageId - Optional identifier for the page
 */
export const trackScrollDepth = (scrollDepth: 25 | 50 | 75 | 90, pageId?: string) => {
  trackEvent('scroll_depth', {
    percent: scrollDepth,
    page_id: pageId || window.location.pathname
  });
};
