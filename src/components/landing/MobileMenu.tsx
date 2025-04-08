
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown, Users, Home, MessageSquare, ShoppingBag, Heart, LogIn, UserPlus, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  const menuItems = [
    { label: "Home", icon: Home, href: "#home" },
    { label: "Features", icon: ShoppingBag, href: "#features" },
    { label: "Testimonials", icon: Users, href: "#testimonials" },
    { label: "Get Started", icon: ChevronDown, href: "#cta" },
  ];

  const authItems = [
    { label: "Login", icon: LogIn, href: "/auth/SignIn", variant: "outline" as const },
    { label: "Sign Up", icon: UserPlus, href: "/auth/SignUp", variant: "default" as const },
    { label: "Explore as Guest", icon: Ghost, href: "/home", variant: "secondary" as const }
  ];

  return (
    <>
      {/* Menu button */}
      <button
        onClick={toggleMenu}
        className="lg:hidden text-white focus:outline-none z-50 relative"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 lg:hidden"
            onClick={toggleMenu}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed right-0 top-0 h-full w-full max-w-xs bg-black border-l border-white/10 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Close button for mobile */}
                <div className="flex justify-end">
                  <button
                    onClick={toggleMenu}
                    className="p-2 rounded-full hover:bg-white/5"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Navigation items */}
                <nav className="py-8">
                  <ul className="space-y-4">
                    {menuItems.map((item) => (
                      <motion.li key={item.label}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <a
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 rounded-lg transition-colors"
                          onClick={toggleMenu}
                        >
                          <item.icon className="w-5 h-5 text-blue-400" />
                          <span>{item.label}</span>
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </nav>

                {/* Auth buttons */}
                <div className="mt-auto space-y-4">
                  {authItems.map((item) => (
                    <Link key={item.label} to={item.href} onClick={toggleMenu}>
                      <Button 
                        variant={item.variant} 
                        className="w-full justify-start gap-2"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>
                
                <div className="text-xs text-white/40 text-center pt-8">
                  © 2025 Tradezy. All rights reserved.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
