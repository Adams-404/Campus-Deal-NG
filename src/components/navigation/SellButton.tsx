
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SellButtonProps {
  item: {
    icon: React.FC<any>;
    label: string;
    onClick: () => void;
  };
  theme: string;
  isCollapsed?: boolean;
}

export const SellButton = ({ item, theme, isCollapsed }: SellButtonProps) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "group relative flex items-center justify-between transition-all duration-300",
            isCollapsed ? "w-12 h-12 p-0 justify-center mx-auto" : "w-[80%] px-6 py-3",
            theme === 'light'
              ? "bg-gradient-to-r from-white/90 via-green-50 to-white/90 border-2 border-[#16a34a] shadow-sm"
              : "bg-gradient-to-r from-black/80 via-emerald-500/20 to-black/80 border border-emerald-500/30 shadow-md"
          )}
          style={{
            borderRadius: '2rem',
          }}
          onClick={item.onClick}
        >
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="relative">
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-full",
                  theme === 'light' ? "bg-[#16a34a]/10" : "bg-emerald-500/20"
                )}
                initial={{ scale: 0.9 }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
              <div className={cn(
                "flex items-center justify-center rounded-full",
                isCollapsed ? "w-8 h-8" : "w-10 h-10",
                theme === 'light' ? "bg-white shadow-md" : "bg-black shadow-inner border border-emerald-500/30"
              )}>
                <item.icon className={cn(
                  theme === 'light' ? "text-orange-600" : "text-orange-500",
                  isCollapsed ? "h-4 w-4" : "h-5 w-5"
                )} />
              </div>
            </div>
            {!isCollapsed && (
              <span className={cn(
                "text-lg font-medium",
                theme === 'light' ? "text-[#16a34a]" : "text-emerald-500"
              )}>{item.label}</span>
            )}
          </div>
          {!isCollapsed && (
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              theme === 'light' ? "bg-orange-500/10 text-orange-600" : "bg-orange-500/20 text-orange-500"
            )}>
              <ShoppingBag className="h-4 w-4" />
            </div>
          )}
        </Button>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right" className="bg-black/90 text-white border-white/10 px-3 py-1 ml-2">
          {item.label}
        </TooltipContent>
      )}
    </Tooltip>
  );
};
