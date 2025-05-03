import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './integrations/supabase/client';
import Index from './pages/Index';
import Homepage from './pages/Homepage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import CategoryPage from './pages/CategoryPage';
import AuthWrapper from './pages/AuthWrapper';
import Messages from './pages/Messages';
import Saved from './pages/Saved';
import UserProfile from './pages/UserProfile';
import ItemDetails from './pages/ItemDetails';
import AdminPanel from './pages/AdminPanel';
import LazyHomepage from './pages/LazyHomepage';

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
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'github']}
                redirectTo={`${window.location.origin}/home`}
              />
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
