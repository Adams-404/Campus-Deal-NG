import { motion } from "framer-motion";
import { useAppMode, AppMode } from "@/contexts/AppModeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import {
  ShoppingBag,
  Briefcase,
  Calendar,
  Newspaper,
  BookOpen,
  Search,
  Home,
  ChevronsUpDown,
  Grid
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const ModeToggle = ({ isCollapsed }: { isCollapsed?: boolean }) => {
  const { currentMode, setCurrentMode } = useAppMode();
  const { theme } = useTheme();

  const modes: { id: AppMode; label: string; icon: any; color: string; bgColor: string }[] = [
    { id: 'marketplace', label: 'Market', icon: ShoppingBag, color: 'text-blue-500', bgColor: 'bg-blue-500' },
    { id: 'gigs', label: 'Gigs', icon: Briefcase, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'text-pink-500', bgColor: 'bg-pink-500' },
    { id: 'news', label: 'News', icon: Newspaper, color: 'text-purple-500', bgColor: 'bg-purple-500' },
    { id: 'study', label: 'Study', icon: BookOpen, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'lost', label: 'Lost', icon: Search, color: 'text-green-500', bgColor: 'bg-green-500' },
    { id: 'room', label: 'Room', icon: Home, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
  ];

  const currentModeData = modes.find(m => m.id === currentMode) || modes[0];
  const CurrentIcon = currentModeData.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-auto rounded-xl border-2 transition-all duration-300",
            isCollapsed ? "w-12 h-12 p-0 justify-center" : "w-full justify-between px-3 py-2",
            theme === 'light'
              ? "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
          )}
        >
          {isCollapsed ? (
            <div className={cn(
              "p-1.5 rounded-lg text-white",
              currentModeData.bgColor
            )}>
              <CurrentIcon className="w-4 h-4" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg text-white",
                  currentModeData.bgColor
                )}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <span className="font-medium">{currentModeData.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChevronsUpDown className="w-4 h-4 opacity-50" />
                <Grid className="w-4 h-4 opacity-50" />
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-80 p-4",
          theme === 'light' ? "bg-white" : "bg-zinc-950 border-zinc-800"
        )}
        align="start"
        side={isCollapsed ? "right" : "bottom"}
      >
        <div className="grid grid-cols-3 gap-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setCurrentMode(mode.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-accent text-accent-foreground ring-1 ring-border"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full transition-colors",
                  isActive ? `${mode.bgColor} text-white` : `bg-muted/50 ${mode.color}`
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};