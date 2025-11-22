import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const GigCardSkeleton = () => {
    return (
        <Card className="flex flex-col h-full border border-border overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-20 rounded-full" /> {/* Category Badge */}
                    <div className="flex flex-col items-end gap-1">
                        <Skeleton className="h-6 w-24" /> {/* Price */}
                        <Skeleton className="h-3 w-16" /> {/* per service */}
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-full" /> {/* Title Line 1 */}
                    <Skeleton className="h-6 w-2/3" /> {/* Title Line 2 */}
                </div>
            </CardHeader>

            <div className="px-6 pb-3">
                <Skeleton className="w-full h-48 rounded-lg" /> {/* Image */}
            </div>

            <CardContent className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>

                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
                        <Skeleton className="h-4 w-24" /> {/* Name */}
                    </div>
                    <Skeleton className="h-9 w-28 rounded-md" /> {/* Button */}
                </div>
            </CardContent>
        </Card>
    );
};
