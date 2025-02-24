
import { Book, Pencil, ShirtIcon, Laptop } from "lucide-react";

const categories = [
  { name: "Textbooks", icon: Book, color: "text-danger" },
  { name: "Electronics", icon: Laptop, color: "text-primary" },
  { name: "Stationery", icon: Pencil, color: "text-warning" },
  { name: "Clothing", icon: ShirtIcon, color: "text-success" },
];

export const Categories = () => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold mb-6">Browse Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            className="flex flex-col items-center p-6 bg-secondary rounded-lg border border-white/10 hover:border-primary/20 hover:bg-primary/5 transition-all group animate-fadeIn"
          >
            <category.icon className={`h-8 w-8 ${category.color} mb-3 group-hover:scale-110 transition-transform`} />
            <span className="text-gray-300 font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
