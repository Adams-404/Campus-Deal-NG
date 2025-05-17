
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize page view tracking for Google Analytics
const trackPageView = () => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }
};

// Add event listener for route changes to track page views
document.addEventListener('DOMContentLoaded', () => {
  trackPageView();
  
  // Set up MutationObserver to detect title changes (indicating page changes)
  const titleElement = document.querySelector('title');
  if (titleElement) {
    const observer = new MutationObserver(() => {
      trackPageView();
    });
    observer.observe(titleElement, { childList: true });
  }
});

// Add gtag to window type
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

createRoot(document.getElementById("root")!).render(<App />);
