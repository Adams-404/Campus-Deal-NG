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

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const hideNav = ["/", "/auth", "/auth/signin", "/auth/signup"].includes(location.pathname);
  const hideBottomNav = ["/", "/auth", "/auth/signin", "/auth/signup"].includes(location.pathname);
  
  useEffect(() => {
    if (location.pathname !== '/') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {!hideNav && <Navbar />}
      <main className={cn("flex-1", !hideNav && "pt-32")}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Homepage />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/saved" element={<SavedItems />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="/share" element={<Share />} />
            <Route path="/item/:id" element={<ViewItem />} />
            <Route path="/auth" element={<AuthLayout />}>
              <Route index element={<SignIn />} />
              <Route path="signin" element={<SignIn />} />
              <Route path="signup" element={<SignUp />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <SettingsProvider>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="relative min-h-screen overflow-x-hidden">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnimatedRoutes />
              </BrowserRouter>
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </SettingsProvider>
  </ThemeProvider>
);

export default App;
