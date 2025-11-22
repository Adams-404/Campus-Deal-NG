
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
  isCollapsed?: boolean;
}

export const SideNavItem = ({ item, theme, isCollapsed }: SideNavItemProps) => {
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
          whileHover="hover"
          whileTap="tap"
          variants={iconAnimations}
        >
          <item.icon className={cn(
            "h-6 w-6 transition-all duration-300",
            isActive
              ? theme === 'light' ? "stroke-orange-600 stroke-[2.5px]" : "stroke-orange-500 stroke-[2.5px]"
              : theme === 'light' ? "text-black" : "text-gray-300"
          )} />
        </motion.div>
      </div>
      {!isCollapsed && (
        <>
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
        </>
      )}
      {isCollapsed && item.hasNotification && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
      )}
      {isActive && (
        <motion.div
          className={cn(
            "absolute bottom-0 h-0.5 rounded-full",
            theme === 'light' ? "bg-[#16a34a]" : "bg-emerald-500",
            isCollapsed ? "left-2 right-2" : "left-6 right-6"
          )}
          initial={{ width: 0, left: '50%', right: '50%' }}
          animate={{ width: isCollapsed ? '40%' : '60%', left: isCollapsed ? '30%' : '20%', right: isCollapsed ? '30%' : '20%' }}
          transition={{ duration: 0.3 }}
        />
      )}
    </>
  );

  if (item.onClick) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "group relative flex items-center w-full rounded-xl text-base transition-all duration-300",
                isCollapsed ? "justify-center px-2 py-3" : "gap-3.5 px-5 py-3",
                theme === 'light' ? "text-black hover:bg-white hover:shadow-sm" : "text-gray-300 hover:bg-white/5"
              )}
              onClick={item.onClick}
            >
              {renderContent()}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="bg-black/90 text-white border-white/10 px-3 py-1 ml-2">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            className={cn(
              "group relative flex items-center w-full rounded-xl text-base transition-all duration-300",
              isCollapsed ? "justify-center px-2 py-3" : "gap-3.5 px-5 py-3",
              theme === 'light' ? "text-black hover:bg-white hover:shadow-sm" : "text-gray-300 hover:bg-white/5"
            )}
          >
            {renderContent()}
          </Link>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="bg-black/90 text-white border-white/10 px-3 py-1 ml-2">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
