
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";

export const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  
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
  
  const navItems = [
    { label: "Features", href: "#features" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Get Started", href: "#cta" }
  ];
  
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 py-2 transition-colors duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-lg border-b border-white/10" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Tradezy
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Navigation */}
            <div className="flex space-x-6">
              {navItems.map((item) => (
                <a 
                  key={item.label}
                  href={item.href}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
            
            {/* Auth buttons */}
            <div className="flex space-x-3">
              <Link to="/auth/SignIn">
                <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                  Login
                </Button>
              </Link>
              <Link to="/auth/SignUp">
                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <MobileMenu />
          </div>
        </nav>
      </div>
    </motion.header>
  );
};
