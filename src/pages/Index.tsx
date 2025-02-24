
import { Navbar } from "@/components/Navbar";
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <section className="py-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to GSU Market
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Buy and sell within your university community
          </p>
        </section>
        <Categories />
        <ProductGrid />
      </main>
    </div>
  );
};

export default Index;
