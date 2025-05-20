
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LogoutButtonProps {
  onClick: () => void;
  theme: string;
}

export const LogoutButton = ({ onClick, theme }: LogoutButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "group relative flex items-center gap-3 w-full py-3 px-4 h-auto rounded-lg transition-all duration-300",
            theme === 'light' ? "text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200" : "text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
          )}
          onClick={onClick}
        >
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute -inset-1 rounded-full bg-red-400/0 group-hover:bg-red-400/10 transition-all duration-300"
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <span className="text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">Logout</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-black/90 text-white border-white/10 px-3 py-1">
        Sign out from your account
      </TooltipContent>
    </Tooltip>
  );
};
