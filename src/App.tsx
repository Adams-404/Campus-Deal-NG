import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
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
import { useEffect } from "react";
import ViewItem from "./pages/ViewItem";
import AuthLayout from "./components/AuthLayout";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import { cn } from "@/lib/utils";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const showNav = location.pathname === '/home';
  const hideBottomNav = ["/", "/auth", "/auth/signin", "/auth/signup"].includes(location.pathname);
  
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {showNav && <Navbar />}
      <main className={cn("flex-1", showNav && "pt-32")}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<SignIn />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
            </Route>
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />

            {/* Protected Routes */}
            <Route path="/home" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
            <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
            <Route path="/item/:id" element={<ProtectedRoute><ViewItem /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <NotificationProvider>
            <TooltipProvider>
              <BrowserRouter>
                <AnimatedRoutes />
                <Toaster />
                <Sonner />
              </BrowserRouter>
            </TooltipProvider>
          </NotificationProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
