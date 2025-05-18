
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import { Toaster } from './components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { SettingsProvider } from './contexts/SettingsContext.tsx'
import { UserProvider } from './contexts/UserContext.tsx' 
import { NotificationProvider } from './contexts/NotificationContext.tsx'
import { SearchProvider } from './contexts/SearchContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SettingsProvider>
          <UserProvider>
            <NotificationProvider>
              <SearchProvider>
                <App />
                <Toaster />
                <SonnerToaster position="top-center" />
              </SearchProvider>
            </NotificationProvider>
          </UserProvider>
        </SettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
