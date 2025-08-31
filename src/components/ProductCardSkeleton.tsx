import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => {
  return (
    <div
      className={
        "rounded-lg border overflow-hidden animate-fadeIn " +
        "backdrop-blur-md " +
        "" +
        "bg-white/80 border-gray-200 dark:bg-black/60 dark:border-white/10"
      }
    >
      <div className="relative aspect-square">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );
};