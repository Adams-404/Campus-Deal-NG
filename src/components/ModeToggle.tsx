import { motion } from "framer-motion";
import { useAppMode } from "@/contexts/AppModeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { ShoppingBag, Briefcase } from "lucide-react";

export const ModeToggle = () => {
  const { currentMode, setCurrentMode } = useAppMode();
  const { theme } = useTheme();

  return (
    <div className={cn(
      "flex items-center justify-center p-1 rounded-full border",
      theme === 'light' 
        ? "bg-gray-100 border-gray-200" 
        : "bg-gray-800 border-gray-700"
    )}>
      <motion.button
        onClick={() => setCurrentMode('marketplace')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative",
          currentMode === 'marketplace'
            ? theme === 'light'
              ? "text-white shadow-sm"
              : "text-white shadow-sm"
            : theme === 'light'
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-400 hover:text-gray-200"
        )}
      >
        {currentMode === 'marketplace' && (
          <motion.div
            layoutId="active-mode"
            className="absolute inset-0 bg-primary rounded-full"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <ShoppingBag className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Market</span>
      </motion.button>
      
      <motion.button
        onClick={() => setCurrentMode('gigs')}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative",
          currentMode === 'gigs'
            ? theme === 'light'
              ? "text-white shadow-sm"
              : "text-white shadow-sm"
            : theme === 'light'
              ? "text-gray-600 hover:text-gray-900"
              : "text-gray-400 hover:text-gray-200"
        )}
      >
        {currentMode === 'gigs' && (
          <motion.div
            layoutId="active-mode"
            className="absolute inset-0 bg-primary rounded-full"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Briefcase className="w-4 h-4 relative z-10" />
        <span className="relative z-10">Gigs</span>
      </motion.button>
    </div>
  );
};