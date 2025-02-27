import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SavedItems from "./pages/SavedItems";
import Help from "./pages/Help";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Share from "./pages/Share";
import { NotificationProvider } from "./contexts/NotificationContext";
import ViewItem from "./pages/ViewItem";
import AuthLayout from "./components/AuthLayout";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import MyListings from "./pages/MyListings";
import UserProfile from "./pages/UserProfile";
import { SearchProvider } from "./contexts/SearchContext";

const queryClient = new QueryClient();

// New AuthGuard component to prevent authenticated users from accessing auth pages
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = location.pathname === '/home';
  const hideBottomNav = ["/", "/auth", "/auth/signin", "/auth/signup"].includes(location.pathname) || location.pathname.match(/^\/messages\/[^/]+$/);
  
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {showNav && <Navbar />}
      <main className={cn("flex-1 pb-24", showNav && "pt-32")}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes with AuthGuard */}
            <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="/auth" element={<AuthGuard><AuthLayout /></AuthGuard>}>
              <Route index element={<SignIn />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
            </Route>

            {/* Always Public Routes */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />

            {/* Protected Routes */}
            <Route path="/home" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/user/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
            <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
            <Route path="/item/:id" element={<ProtectedRoute><ViewItem /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideBottomNav && <div className="fixed bottom-0 left-0 right-0 z-50"><BottomNav /></div>}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <NotificationProvider>
            <SearchProvider>
              <TooltipProvider>
                <BrowserRouter>
                  <AnimatedRoutes />
                  <Toaster />
                  <Sonner />
                </BrowserRouter>
              </TooltipProvider>
            </SearchProvider>
          </NotificationProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
