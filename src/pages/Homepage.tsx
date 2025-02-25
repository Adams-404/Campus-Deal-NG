
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { PageTransition } from "@/components/PageTransition";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useCallback } from "react";
import { toast } from "sonner";
import { useScrollPosition } from "@/hooks/useScrollPosition";

const Homepage = () => {
  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Content refreshed");
  }, []);

  useScrollPosition();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PullToRefresh onRefresh={handleRefresh}>
          <PageTransition>
            {/* Categories and Products */}
            <section className="py-12">
              <h2 className="text-3xl font-bold mb-8">Trending Categories</h2>
              <Categories />
              <ProductGrid />
            </section>
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
