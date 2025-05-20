
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface SideNavItemProps {
  item: {
    icon: React.FC<any>;
    label: string;
    href: string;
    onClick?: () => void;
    hasNotification?: boolean;
    notificationCount?: number;
    desktopOnly?: boolean;
  };
  theme: string;
}

export const SideNavItem = ({ item, theme }: SideNavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  
  // Different animation variants for the icon
  const iconAnimations = {
    hover: {
      rotate: [0, -10, 10, -5, 5, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.6 }
    },
    tap: {
      scale: 0.9
    }
  };

  const renderContent = () => (
    <>
      <div className="relative flex items-center justify-center">
        <motion.div
          className={cn(
            "absolute -inset-3 rounded-full",
            isActive ? theme === 'light' ? "bg-[#16a34a]/10" : "bg-emerald-500/10" : "bg-transparent"
          )}
          whileHover="hover"
          whileTap="tap"
          variants={{
            hover: { scale: 1.1, opacity: 0.8 },
            tap: { scale: 0.9 }
          }}
        />
        <motion.div
          whileHover="hover"
          whileTap="tap"
          variants={iconAnimations}
        >
          <item.icon className={cn(
            "h-6 w-6 transition-all duration-300", 
            isActive
              ? theme === 'light' ? "stroke-[#16a34a] stroke-[2.5px]" : "stroke-emerald-500 stroke-[2.5px]"
              : theme === 'light' ? "text-black" : "text-gray-300"
          )} />
        </motion.div>
      </div>
      <span className={cn(
        "text-lg font-medium transition-all duration-300",
        isActive && (theme === 'light' ? "text-[#16a34a]" : "text-emerald-500")
      )}>
        {item.label}
      </span>
      {item.hasNotification && (
        <div className="ml-auto flex items-center justify-center">
          <div className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
            {item.notificationCount && item.notificationCount > 99 ? "99+" : item.notificationCount}
          </div>
        </div>
      )}
      {isActive && (
        <motion.div
          className={cn(
            "absolute bottom-0 left-6 right-6 h-0.5 rounded-full",
            theme === 'light' ? "bg-[#16a34a]" : "bg-emerald-500"
          )}
          initial={{ width: 0, left: '50%', right: '50%' }}
          animate={{ width: '60%', left: '20%', right: '20%' }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: '120px' }} /* Limit the width of active indicator */
        />
      )}
    </>
  );

  if (item.onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "group relative flex items-center gap-4 w-full py-4 px-6 rounded-xl text-lg transition-all duration-300",
                theme === 'light' ? "text-black hover:bg-white hover:shadow-sm" : "text-gray-300 hover:bg-white/5"
              )}
              onClick={item.onClick}
            >
              {renderContent()}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-black/90 text-white border-white/10 px-3 py-1">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            className={cn(
              "group relative flex items-center gap-4 w-full py-4 px-6 rounded-xl text-lg transition-all duration-300",
              theme === 'light' ? "text-black hover:bg-white hover:shadow-sm" : "text-gray-300 hover:bg-white/5"
            )}
          >
            {renderContent()}
          </Link>
        </TooltipTrigger>
        <TooltipContent className="bg-black/90 text-white border-white/10 px-3 py-1">
          {item.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
