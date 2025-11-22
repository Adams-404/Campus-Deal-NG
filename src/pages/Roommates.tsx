import { Home } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const Roommates = () => {
    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 sm:pt-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <Home className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Roommates & Housing</h1>
                    <p className="text-muted-foreground max-w-md">
                        Find the perfect roommate or your next home away from home.
                        This feature is coming soon!
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};

export default Roommates;
