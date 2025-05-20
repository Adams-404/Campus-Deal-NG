
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfileSectionProps {
  userProfile: any;
  user: any;
  theme: string;
}

export const UserProfileSection = ({ userProfile, user, theme }: UserProfileSectionProps) => {
  if (!userProfile) return null;
  
  return (
    <div className="group relative flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-300 hover:bg-primary/5">
      <div className="relative">
        <motion.div
          className="absolute -inset-1 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"
          initial={{ scale: 0.9, opacity: 0 }}
          whileHover={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
        <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-all duration-300 shadow-sm">
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
