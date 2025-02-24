
import { X, Upload, Plus, Video } from "lucide-react";
import { Button } from "./ui/button";

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellModal = ({ isOpen, onClose }: SellModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-secondary w-full rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">List an Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Media</label>
            <div className="grid grid-cols-4 gap-2">
              <button className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Photo</span>
              </button>
              <button className="aspect-square rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                <Video className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Video</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Title</label>
            <input
              type="text"
              placeholder="What are you selling?"
              className="w-full bg-background rounded-lg border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Price</label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-400">₦</span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-background rounded-lg border border-white/10 px-4 py-2 pl-8 text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Category</label>
            <select className="w-full bg-background rounded-lg border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-primary">
              <option value="">Select a category</option>
              <option value="textbooks">Textbooks</option>
              <option value="electronics">Electronics</option>
              <option value="furniture">Furniture</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              placeholder="Describe what you're selling..."
              rows={4}
              className="w-full bg-background rounded-lg border border-white/10 px-4 py-2 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10">
          <Button className="w-full bg-primary text-white hover:bg-primary/90">
            List Item for Sale
          </Button>
        </div>
      </div>
    </div>
  );
};
