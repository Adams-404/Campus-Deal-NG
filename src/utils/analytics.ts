
// Google Analytics Utility Functions

/**
 * Track a page view event in Google Analytics
 * @param path - The path of the page to track
 * @param title - The title of the page
 */
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) return;
  
  try {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      send_to: 'G-VP0LDXL127'
    });
    console.log(`📊 Analytics: Page view tracked - ${path}`);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Track custom events in Google Analytics
 * @param eventName - Name of the event to track
 * @param eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (!window.gtag) return;
  
  try {
    window.gtag('event', eventName, eventParams);
    console.log(`📊 Analytics: Event tracked - ${eventName}`, eventParams);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Declare gtag for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
