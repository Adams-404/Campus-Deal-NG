import { X, Upload, Video, ImagePlus, Trash2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, FormEvent } from "react";
import { ImageCarousel } from "./ui/image-carousel";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemListed?: () => void;
}

interface FormData {
  title: string;
  price: string;
  category: string;
  condition: string;
  description: string;
}

export const SellModal = ({ isOpen, onClose, onItemListed }: SellModalProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    price: '',
    category: '',
    condition: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (images.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setImages(prev => [...prev, ...newImages]);
    const newImageUrls = newImages.map(file => URL.createObjectURL(file));
    setImageUrls(prev => [...prev, ...newImageUrls]);
  };

  const handleVideoUpload = (files: FileList | null) => {
    if (!files) return;

    const newVideos = Array.from(files).filter(file => file.type.startsWith('video/'));
    if (videos.length + newVideos.length > 1) {
      toast.error("Only 1 video allowed");
      return;
    }

    setVideos(prev => [...prev, ...newVideos]);
    const newVideoUrls = newVideos.map(file => URL.createObjectURL(file));
    setVideoUrls(prev => [...prev, ...newVideoUrls]);
  };

  const uploadFile = async (file: File, bucket: 'item_images' | 'item_videos', itemId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${itemId}/${uuidv4()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Validate form
      if (!formData.title || !formData.price || !formData.category || !formData.condition) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (images.length === 0) {
        toast.error("Please add at least one image");
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in to list items");

      // Create item record
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          condition: formData.condition,
          category: formData.category,
          status: 'active'
        })
        .select()
        .single();

      if (itemError || !item) throw itemError || new Error("Failed to create item");

      // Upload images
      const imagePromises = images.map(async (image, index) => {
        const publicUrl = await uploadFile(image, 'item_images', item.id);
        return supabase
          .from('item_images')
          .insert({
            item_id: item.id,
            image_url: publicUrl,
            is_primary: index === 0
          });
      });

      // Upload video if exists
      const videoPromises = videos.map(async (video) => {
        const publicUrl = await uploadFile(video, 'item_videos', item.id);
        return supabase
          .from('item_videos')
          .insert({
            item_id: item.id,
            video_url: publicUrl
          });
      });

      await Promise.all([...imagePromises, ...videoPromises]);

      toast.success("Item listed successfully!");
      onItemListed?.();
      onClose();

    } catch (error: any) {
      toast.error(error.message || "Failed to list item");
    } finally {
      setIsSubmitting(false);
    }
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
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="bg-secondary w-full sm:w-[95%] md:w-[90%] lg:w-[80%] max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className="sticky top-0 z-10 flex justify-between items-center p-3 sm:p-4 border-b border-white/10 bg-secondary/95 backdrop-blur-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-white">List an Item</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 sm:h-10 sm:w-10">
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Media</label>
            {(imageUrls.length > 0 || videoUrls.length > 0) && (
              <div className="mb-3 sm:mb-4 rounded-lg overflow-hidden">
                <ImageCarousel 
                  images={[...imageUrls, ...videoUrls]} 
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
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] sm:aspect-video rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 sm:gap-2 hover:border-primary/50 transition-colors"
                >
                  <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-400">Add Photos</span>
                  <span className="text-[10px] sm:text-xs text-gray-500">or drag and drop</span>
                </button>
                <button
                  type="button"
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
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What are you selling?"
              className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Price</label>
            <div className="relative">
              <span className="absolute left-3 sm:left-4 top-[10px] sm:top-[13px] text-gray-400 text-sm sm:text-base">₦</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 pl-6 sm:pl-8 text-sm sm:text-base text-white focus:outline-none focus:border-primary"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary appearance-none"
              required
            >
              <option value="">Select a category</option>
              <option value="textbooks">Textbooks</option>
              <option value="electronics">Electronics</option>
              <option value="stationery">Stationery</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Condition</label>
            <select 
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="w-full h-10 sm:h-11 bg-background rounded-lg border border-white/10 px-3 sm:px-4 text-sm sm:text-base text-white focus:outline-none focus:border-primary appearance-none"
              required
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you're selling..."
              rows={4}
              className="w-full bg-background rounded-lg border border-white/10 px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-primary resize-none"
              required
            />
          </div>

          <div className="pt-2 sm:pt-4">
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing Item...
                </>
              ) : (
                "List Item"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
