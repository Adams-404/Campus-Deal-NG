
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";
import { useState, useEffect } from "react";

const SAMPLE_PRODUCTS = [
  {
    id: "1",
    title: "MacBook Pro 2019",
    price: 899,
    images: [
      "https://source.unsplash.com/photo-1488590528505-98d2b5aba04b",
      "https://source.unsplash.com/photo-1517336714731-489689fd1ca4",
      "https://source.unsplash.com/photo-1611186871348-b1ce696e52c9"
    ],
    condition: "like_new",
    seller: {
      full_name: "John Doe",
      first_name: "John",
      avatar_url: "/avatars/john.jpg"
    }
  },
  {
    id: "2",
    title: "Psychology 101 Textbook",
    price: 45,
    images: [
      "https://source.unsplash.com/photo-1519389950473-47ba0277781c",
      "https://source.unsplash.com/photo-1532012197267-da84d127e765"
    ],
    condition: "good",
    seller: {
      full_name: "Alice Smith",
      first_name: "Alice",
      avatar_url: "/avatars/alice.jpg"
    }
  },
  {
    id: "3",
    title: "Study Desk",
    price: 120,
    images: [
      "https://source.unsplash.com/photo-1460925895917-afdab827c52f",
      "https://source.unsplash.com/photo-1518455027359-f3f8164ba6bd"
    ],
    condition: "new",
    seller: {
      full_name: "Bob Johnson",
      first_name: "Bob",
      avatar_url: "/avatars/bob.jpg"
    }
  },
  {
    id: "4",
    title: "Dorm Room Essentials Bundle",
    price: 75,
    images: [
      "https://source.unsplash.com/photo-1721322800607-8c38375eef04",
      "https://source.unsplash.com/photo-1628152371231-dc510305f538"
    ],
    condition: "various",
    seller: {
      full_name: "Emma Wilson"
    }
  },
];

interface ProductGridProps {
  items?: any[];
  title?: string;
}

export const ProductGrid = ({ items = SAMPLE_PRODUCTS, title = "Featured Listings" }: ProductGridProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState(items);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setProducts(items);
  }, [items]);

  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              item={product}
            />
          ))
        )}
      </div>
    </div>
  );
};
