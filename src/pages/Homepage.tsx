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
            <section className="py-6 pb-32">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Trending Categories</h2>
                  <Categories />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Featured Items</h2>
                  <ProductGrid />
                </div>
              </div>
            </section>
          </PageTransition>
        </PullToRefresh>
      </main>
    </div>
  );
};

export default Homepage;
