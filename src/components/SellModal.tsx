
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ImageUploader } from './ImageUploader';
import { supabase } from '@/integrations/supabase/client';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { SafetyTips } from './SafetyTips';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemListed?: () => void;
}

type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export const SellModal = ({ isOpen, onClose, onItemListed }: SellModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('new');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSellForm, setShowSellForm] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const { settings } = useSettings();
  const { toast: uiToast } = useToast();

  useEffect(() => {
    if (isOpen && settings.showSellingSafetyTips) {
      setShowSafetyTips(true);
    } else if (isOpen) {
      setShowSellForm(true);
    }
  }, [isOpen, settings.showSellingSafetyTips]);

  const handleClose = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setCondition('new');
    setImages([]);
    setShowSellForm(false);
    setShowSafetyTips(false);
    onClose();
  };

  const handleSafetyTipsClose = () => {
    setShowSafetyTips(false);
    setShowSellForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        uiToast({
          title: "Authentication Error",
          description: "You must be logged in to sell items",
          variant: "destructive",
        });
        return;
      }

      // Convert price to number
      const numericPrice = parseFloat(price);
      
      if (isNaN(numericPrice) || numericPrice <= 0) {
        uiToast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          title,
          description,
          price: numericPrice,
          category,
          condition,
          seller_id: user.id,
          status: 'active'
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Upload images
      if (images.length > 0) {
        const imageUploadPromises = images.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${item.id}/${Date.now()}-${index}.${fileExt}`;
          const filePath = `items/${fileName}`;

          const { error: uploadError } = await supabase
            .storage
            .from('item-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase
            .storage
            .from('item-images')
            .getPublicUrl(filePath);

          // Add image to item_images table
          const { error: imageError } = await supabase
            .from('item_images')
            .insert({
              item_id: item.id,
              image_url: publicUrl
            });

          if (imageError) throw imageError;

          return publicUrl;
        });

        await Promise.all(imageUploadPromises);
      }

      toast.success('Item listed successfully!');
      if (onItemListed) {
        onItemListed();
      }
      handleClose();
    } catch (error: any) {
      console.error('Error creating listing:', error);
      uiToast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SafetyTips 
        open={showSafetyTips} 
        onClose={handleSafetyTipsClose} 
        scenario="selling" 
      />
    
      <Dialog open={isOpen && showSellForm} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sell an Item</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you selling?"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price (₦)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={(value: ItemCondition) => setCondition(value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-4 gap-2">
                {images.map((file, index) => (
                  <div key={index} className="relative h-20 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`Preview ${index}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...images];
                        newImages.splice(index, 1);
                        setImages(newImages);
                      }}
                      className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 8 && (
                  <ImageUploader
                    onImageSelected={(file) => {
                      if (images.length < 8) {
                        setImages([...images, file]);
                      } else {
                        uiToast({
                          title: "Maximum images reached",
                          description: "You can only upload up to 8 images",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">Upload up to 8 images</p>
            </div>
            
            <div className="pt-4 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                List Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
