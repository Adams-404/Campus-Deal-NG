
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from './integrations/supabase/client';
import Index from './pages/Index';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CategoryPage from './pages/CategoryPage';
import Messages from './pages/Messages';
import UserProfile from './pages/UserProfile';
import LazyHomepage from './pages/LazyHomepage';
import AuthWrapper from './pages/AuthWrapper';
import Saved from './pages/Saved';
import ItemDetails from './pages/ItemDetails';
import AdminPanel from './pages/AdminPanel';
import NotificationsPage from './pages/NotificationsPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<LazyHomepage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/user/:userId" element={<UserProfile />} />
        <Route path="/item/:itemId" element={<ItemDetails />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/admin" element={<AdminPanel />} />

        {/* Auth Routes */}
        <Route
          path="/auth/*"
          element={
            <AuthWrapper>
              <div className="w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Sign in with your email</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Enter your email below to receive a magic link for passwordless sign in
                </p>
                <form className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Your email"
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full bg-primary text-white p-2 rounded"
                  >
                    Send Magic Link
                  </button>
                </form>
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <a href="/auth/sign-up" className="text-primary font-medium">
                      Sign up
                    </a>
                  </p>
                </div>
              </div>
            </AuthWrapper>
          }
        />

        {/* Redirect unauthenticated users to /auth */}
        <Route
          path="*"
          element={<Navigate to="/auth/sign-in" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
