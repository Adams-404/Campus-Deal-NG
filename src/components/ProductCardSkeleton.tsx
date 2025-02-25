import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => {
  return (
    <div className="bg-secondary rounded-lg border border-white/10 overflow-hidden animate-fadeIn">
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