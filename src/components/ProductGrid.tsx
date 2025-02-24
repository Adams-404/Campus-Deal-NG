
import { ProductCard } from "./ProductCard";

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    title: "MacBook Pro 2019",
    price: 899,
    image: "https://source.unsplash.com/photo-1488590528505-98d2b5aba04b",
    condition: "Like New",
  },
  {
    id: 2,
    title: "Psychology 101 Textbook",
    price: 45,
    image: "https://source.unsplash.com/photo-1519389950473-47ba0277781c",
    condition: "Good",
  },
  {
    id: 3,
    title: "Study Desk",
    price: 120,
    image: "https://source.unsplash.com/photo-1460925895917-afdab827c52f",
    condition: "New",
  },
  {
    id: 4,
    title: "Dorm Room Essentials Bundle",
    price: 75,
    image: "https://source.unsplash.com/photo-1721322800607-8c38375eef04",
    condition: "Various",
  },
];

export const ProductGrid = () => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Featured Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SAMPLE_PRODUCTS.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
};
