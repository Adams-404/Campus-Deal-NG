
import React from "react";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface SideNavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive?: boolean;
}

export const SideNavItem: React.FC<SideNavItemProps> = ({ 
  icon: Icon, 
  label, 
  href, 
  isActive = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group relative
        ${isActive 
          ? 'bg-primary text-primary-foreground shadow-lg' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
        }
      `}
    >
      {/* Active indicator line */}
      {isActive && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary-foreground rounded-r-full transition-all duration-200"
          style={{ height: '60%' }}
        />
      )}
      
      <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary-foreground' : ''}`} />
      <span className={`font-medium transition-colors ${isActive ? 'text-primary-foreground' : ''}`}>
        {label}
      </span>
    </button>
  );
};
