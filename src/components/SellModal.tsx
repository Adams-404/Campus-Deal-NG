import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ImageIcon, Plus, X } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { InputWithEmojiPicker } from "@/components/InputWithEmojiPicker";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemListed: () => void;
}

export const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, onItemListed }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages(prevImages => [...prevImages, ...acceptedFiles]);
  }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    maxFiles: 5,
  });

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title || !price || !description || !category || !condition || images.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields and upload at least one image.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to list an item.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Create item record in the database
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          seller_id: user.id,
          title,
          price: parseFloat(price),
          description,
          category,
          condition,
          is_negotiable: isNegotiable,
          status: 'active',
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // 2. Upload images to storage and create image records
      const uploadPromises = images.map(async (image, index) => {
        const imageName = `${uuidv4()}-${image.name}`;
        const imagePath = `items/${item.id}/${imageName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(imagePath, image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: `Failed to upload image ${index + 1}. Please try again.`,
          });
          return null;
        }

        // Get public URL
        const publicURL = supabase.storage.from('images').getPublicUrl(imagePath).data.publicUrl;

        // Create image record in the database
        const { error: imageRecordError } = await supabase
          .from('item_images')
          .insert({
            item_id: item.id,
            image_url: publicURL,
          });

        if (imageRecordError) {
          console.error('Error creating image record:', imageRecordError);
          toast({
            variant: "destructive",
            title: "Database Error",
            description: `Failed to create image record for image ${index + 1}.`,
          });
          return null;
        }

        // Update upload progress
        setUploadProgress(prevProgress => prevProgress + (100 / images.length));

        return data;
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Check if any uploads failed
      if (uploadedImages.some(image => image === null)) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "One or more images failed to upload. Please check the error messages.",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Item listed successfully!",
      });

      onItemListed();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error listing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to list item. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setCategory('');
    setCondition('');
    setIsNegotiable(false);
    setImages([]);
    setUploadProgress(0);
    setIsUploading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>List a new item</DialogTitle>
          <DialogDescription>
            Fill in the details below to list your item on the marketplace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <InputWithEmojiPicker id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right mt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory} className="col-span-3">
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="condition" className="text-right">
              Condition
            </Label>
            <Select value={condition} onValueChange={setCondition} className="col-span-3">
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
          </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="negotiable" className="text-right">
              Negotiable
            </Label>
            <Switch
              id="negotiable"
              checked={isNegotiable}
              onCheckedChange={setIsNegotiable}
              className="col-span-3"
            />
          </div>

          {/* Image Upload Section */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right mt-2">
              Images
            </Label>
            <div className="col-span-3">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-md p-4 cursor-pointer",
                  isDragActive ? "border-primary" : "border-muted-foreground",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? "Drop the images here..." : "Click or drag images to upload (max 5)"}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <AspectRatio ratio={1} className="relative overflow-hidden rounded-md">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={image.name}
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isUploading && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Upload Progress
              </Label>
              <Progress value={uploadProgress} className="col-span-3" />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit">List Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
