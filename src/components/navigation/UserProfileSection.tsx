
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileSectionProps {
  userProfile: any;
  user: any;
  theme: string;
  isLoading?: boolean;
}

export const UserProfileSection = ({ userProfile, user, theme, isLoading = false }: UserProfileSectionProps) => {
  if (isLoading) {
    // Use a semi-transparent background similar to header/bottomnav
    return (
      <div className={cn(
        "group relative flex items-center gap-3 w-full px-4 py-2 rounded-xl",
        theme === 'light'
          ? 'bg-white/80 backdrop-blur-md border border-gray-200'
          : 'bg-black/60 backdrop-blur-md border border-white/10'
      )}>
        <div className="relative">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            theme === 'light' ? 'bg-white/60' : 'bg-neutral-800/60'
          )}>
            <div className="flex space-x-1">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", theme === 'light' ? 'bg-primary/40' : 'bg-primary/60')} style={{ animationDelay: '0ms' }}></div>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", theme === 'light' ? 'bg-primary/40' : 'bg-primary/60')} style={{ animationDelay: '150ms' }}></div>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-bounce", theme === 'light' ? 'bg-primary/40' : 'bg-primary/60')} style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className={cn("h-4 rounded w-24", theme === 'light' ? 'bg-primary/10' : 'bg-primary/20')} />
          <div className={cn("h-3 rounded w-32", theme === 'light' ? 'bg-primary/10' : 'bg-primary/20')} />
        </div>
      </div>
    );
  }

  if (!userProfile) return null;
  
  return (
    <div className="group relative flex items-center gap-3 w-full px-4 py-2 rounded-xl transition-all duration-300 hover:bg-primary/5">
      <div className="relative">
        <motion.div
          className="absolute -inset-1 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"
          initial={{ scale: 0.9, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
          <AvatarImage src={userProfile?.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary font-medium">
            {userProfile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm truncate group-hover:text-primary transition-all duration-300", theme === 'light' ? "text-black" : undefined)}>
          {userProfile?.first_name || 'User'}
        </div>
        <div className={cn("text-xs truncate", theme === 'light' ? "text-gray-600" : "text-gray-400")}>{user?.email}</div>
      </div>
    </div>
  );
};
