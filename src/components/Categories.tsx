
import { Book, Pencil, ShirtIcon } from "lucide-react";

const categories = [
  { name: "Textbooks", icon: Book },
  { name: "Electronics", icon: Book }, // Changed from Desktop to Book temporarily
  { name: "Stationery", icon: Pencil },
  { name: "Clothing", icon: ShirtIcon },
];

export const Categories = () => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Browse Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group animate-fadeIn"
          >
            <category.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
