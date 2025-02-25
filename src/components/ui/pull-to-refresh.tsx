import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = ({
  onRefresh,
  children,
  className
}: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, isPulling } = usePullToRefresh({
    onRefresh,
    pullDownThreshold: 80,
    maxPullDown: 120
  });

  return (
    <div className={cn("relative", className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-transform duration-200 z-50",
          isPulling ? "-translate-y-1/2" : ""
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: Math.min(1, pullDistance / 80)
        }}
      >
        <div className="bg-primary/10 backdrop-blur-sm rounded-full p-3">
          <Loader2 
            className={cn(
              "w-6 h-6 text-primary",
              isRefreshing ? "animate-spin" : "animate-none"
            )} 
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}; 