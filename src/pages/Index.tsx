import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { PageTransition } from "@/components/PageTransition";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <PageTransition>
          <section className="py-12">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to GSU Market
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              Buy and sell within your university community
            </p>
          </section>
          <Categories />
          <ProductGrid />
        </PageTransition>
      </main>
    </div>
  );
};

export default Index;
