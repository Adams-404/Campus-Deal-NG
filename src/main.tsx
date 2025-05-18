
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize analytics tracking
if (window.gtag) {
  console.log('📊 Google Analytics initialized');
}

createRoot(document.getElementById("root")!).render(<App />);
