import { X, Upload, Video, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef } from "react";
import { ImageCarousel } from "./ui/image-carousel";
import { cn } from "@/lib/utils";

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellModal = ({ isOpen, onClose }: SellModalProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newImages]);
  };

  const handleVideoUpload = (files: FileList | null) => {
    if (!files) return;

    const newVideos = Array.from(files)
      .filter(file => file.type.startsWith('video/'))
      .map(file => URL.createObjectURL(file));

    setVideos(prev => [...prev, ...newVideos]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleImageUpload(files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <div className="bg-secondary w-full sm:w-[95%] md:w-[90%] lg:w-[80%] max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="sticky top-0 z-10 flex justify-between items-center p-3 sm:p-4 border-b border-white/10 bg-secondary/95 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-white">List an Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Media</label>
            {(images.length > 0 || videos.length > 0) && (
              <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden">
                <ImageCarousel 
                  images={[...images, ...videos]} 
                  className="aspect-[4/3] sm:aspect-video bg-black"
                />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg border-2 border-dashed transition-colors",
                isDragging ? "border-primary/50 bg-primary/5" : "border-white/10",
                "p-3 sm:p-4"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] sm:aspect-video rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-400">Add Photos</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">or drag and drop</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] sm:aspect-video rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:border-primary/50 transition-colors"
                >
                  <Video className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-400">Add Video</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">up to 30 seconds</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]?.type.startsWith('video/')) {
                    handleVideoUpload(e.target.files);
                  } else {
                    handleImageUpload(e.target.files);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Title</label>
            <input
              type="text"
              placeholder="What are you selling?"
              className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Price</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-[10px] sm:top-[13px] text-gray-400 text-sm sm:text-base">₦</span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 pl-6 sm:pl-8 text-sm sm:text-base text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Category</label>
            <select className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary appearance-none">
              <option value="">Select a category</option>
              <option value="textbooks">Textbooks</option>
              <option value="electronics">Electronics</option>
              <option value="stationery">Stationery</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Condition</label>
            <select className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary appearance-none">
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              placeholder="Describe what you're selling..."
              rows={4}
              className="w-full bg-background rounded-lg border border-white/10 px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="pt-2 sm:pt-4">
            <Button className="w-full h-10 sm:h-11 text-sm sm:text-base">
              List Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
