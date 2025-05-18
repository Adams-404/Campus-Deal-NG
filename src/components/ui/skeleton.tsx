
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary/80 dark:bg-secondary/80 light:bg-gray-200/80", className)}
      {...props}
      style={{animationDuration: '1s'}} // Faster animation
    />
  )
}

export { Skeleton }
