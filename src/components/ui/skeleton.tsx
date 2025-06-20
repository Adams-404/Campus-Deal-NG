
import { cn } from "@/lib/utils"
import { memo } from "react"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  loading?: boolean;
}

const SkeletonComponent = ({
  className,
  loading = true,
  ...props
}: SkeletonProps) => {
  if (!loading) return null;
  
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary/60 dark:bg-secondary/60 light:bg-gray-200/60", className)}
      {...props}
      style={{animationDuration: '0.8s'}} // Faster, smoother animation
    />
  )
}

export const Skeleton = memo(SkeletonComponent);
