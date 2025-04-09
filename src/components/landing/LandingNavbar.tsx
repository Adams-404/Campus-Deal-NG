
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { SideNav } from "./SideNav";

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showSideNav, setShowSideNav] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Function for smooth scrolling
  const scrollToSection = (sectionId: string) => {
    setShowSideNav(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  return (
    <>
      {/* Side Nav Toggle Button */}
      <motion.button
        onClick={() => setShowSideNav(true)}
        className="fixed top-4 right-4 z-50 bg-blue-500/80 hover:bg-blue-600 backdrop-blur-sm p-2 rounded-full shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Open menu"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </motion.button>
      
      {/* Side Nav */}
      <AnimatePresence>
        {showSideNav && (
          <SideNav 
            onClose={() => setShowSideNav(false)}
            onNavigate={scrollToSection}
          />
        )}
      </AnimatePresence>
    </>
  );
};
