import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowGuest?: boolean;
}

const ProtectedRoute = ({ children, allowGuest = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const location = useLocation();

  const publicRoutes = ['/', '/item/:id', '/settings'];

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleGuestMode = () => {
    setGuestMode(true);
    // Show welcome message for first-time guests
    if (!localStorage.getItem('guestWelcomeShown')) {
      alert('Welcome to Tradezy as a Guest!\nYou can freely browse listings and discover great deals.');
      localStorage.setItem('guestWelcomeShown', 'true');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !guestMode && !allowGuest) {
    if (publicRoutes.includes(location.pathname)) {
      handleGuestMode();
    } else {
      alert('Sign up or log in anytime to unlock the full experience.');
      return <Navigate to="/auth/signin" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;