import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExpandableSectionProps {
  icon: React.ElementType;
  label: string;
  iconColor?: string;
  bgColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ExpandableSection({
  icon: Icon,
  label,
  iconColor,
  bgColor,
  children,
  defaultOpen = false
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-secondary/50 rounded-lg border border-white/10 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full", bgColor || "bg-primary/10")}>
            <Icon className={cn("w-5 h-5", iconColor || "text-primary")} />
          </div>
          <span>{label}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-white/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 