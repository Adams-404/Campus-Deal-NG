import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SavedItems from "./pages/SavedItems";
import { SettingsProvider } from "./contexts/SettingsContext";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  
  return (
    <>
      {isHome && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/saved" element={<SavedItems />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </>
  );
};

const App = () => (
  <SettingsProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </SettingsProvider>
);

export default App;
