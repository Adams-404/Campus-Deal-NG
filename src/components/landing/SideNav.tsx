
import { motion } from "framer-motion";
import { X, ChevronRight, Home, Users, MessageSquare, Bot, ShoppingBag, LogIn, UserPlus } from "lucide-react"; 
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type SideNavProps = {
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
};

export const SideNav = ({ onClose, onNavigate }: SideNavProps) => {
  const navItems = [
    { label: "Home", icon: Home, sectionId: "home" },
    { label: "Features", icon: ShoppingBag, sectionId: "features" },
    { label: "AI Assistant", icon: Bot, sectionId: "ai-assistant" }, 
    { label: "Testimonials", icon: Users, sectionId: "testimonials" },
  ];

  const authItems = [
    { label: "Login", icon: LogIn, href: "/auth/SignIn", variant: "outline" as const },
    { label: "Sign Up", icon: UserPlus, href: "/auth/SignUp", variant: "default" as const }
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Side Nav Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-xs bg-black border-l border-white/10 p-6 z-50 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                GSU Market
              </span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="py-6">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <motion.li key={item.label}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <button
                    onClick={() => onNavigate(item.sectionId)}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-blue-400" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto text-white/60 transform rotate-180" />
                  </button>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Auth buttons */}
          <div className="mt-auto space-y-4">
            {authItems.map((item) => (
              <Link key={item.label} to={item.href} onClick={onClose}>
                <Button 
                  variant={item.variant} 
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            
            <Link to="/home" onClick={onClose}>
              <Button 
                variant="secondary" 
                className="w-full justify-start gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Explore as Guest
              </Button>
            </Link>
          </div>
          
          <div className="text-xs text-white/40 text-center pt-8">
            © 2025 GSU Market. All rights reserved.
          </div>
        </div>
      </motion.div>
    </>
  );
};
