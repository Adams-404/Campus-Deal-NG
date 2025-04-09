
// No longer directly used, behavior moved to SideNav component
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export const MobileMenu = () => {
  // This component is preserved for compatibility but no longer used directly
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
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

      {/* Mobile menu overlay (no longer visible) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>
    </>
  );
};
