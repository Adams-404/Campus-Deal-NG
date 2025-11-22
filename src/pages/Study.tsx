import { BookOpen } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

const Study = () => {
    return (
        <PageTransition>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24 sm:pt-6">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <BookOpen className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Study Groups</h1>
                    <p className="text-muted-foreground max-w-md">
                        Find study partners, share notes, and ace your exams together.
                        This feature is coming soon!
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};

export default Study;
