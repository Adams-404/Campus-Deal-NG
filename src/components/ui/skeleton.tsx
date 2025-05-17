
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary/60", className)}
      {...props}
      style={{animationDuration: '0.8s'}} // Even faster animation for better performance
    />
  )
}

export { Skeleton }
