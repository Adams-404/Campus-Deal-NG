import { useEffect, useState } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Image as ImageIcon } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropModal({ open, onClose, imageFile, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    if (!imageFile) return;

    setIsImageLoading(true);
    const reader = new FileReader();
    
    reader.addEventListener('load', () => {
      // Create a new image to pre-load
      const img = new Image();
      img.src = reader.result?.toString() || '';
      
      img.onload = () => {
        setImageSrc(img.src);
        setIsImageLoading(false);
      };

      img.onerror = () => {
        console.error('Error loading image');
        setIsImageLoading(false);
      };
    });

    reader.addEventListener('error', () => {
      console.error('Error reading file');
      setIsImageLoading(false);
    });

    reader.readAsDataURL(imageFile);

    // Reset states
    setCrop(undefined);
    setCompletedCrop(undefined);
    
    return () => {
      // Cleanup
      setImageSrc('');
      setIsImageLoading(true);
    };
  }, [imageFile]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setImageRef(e.currentTarget);
    
    // Convert the percentage crop to pixel values
    const pixelCrop = {
      unit: 'px',
      x: 0,
      y: 0,
      width: width * 0.9,
      height: height * 0.9
    } as PixelCrop;

    setCrop(centerAspectCrop(width, height, 1));
    setCompletedCrop(pixelCrop);
  }

  const getCroppedImg = async () => {
    if (!imageRef || !completedCrop) return;

    setIsLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      // Set desired output size
      const maxSize = 400;
      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;

      // Calculate dimensions while maintaining aspect ratio
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      // Set canvas size to match the crop size
      canvas.width = maxSize;
      canvas.height = maxSize;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enable image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the cropped image
      ctx.save();
      ctx.drawImage(
        imageRef,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        maxSize,
        maxSize
      );

      // Create circular clip path
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(maxSize / 2, maxSize / 2, maxSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Convert the canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob conversion failed'));
          },
          'image/jpeg',
          1 // Maximum quality
        );
      });

      onCropComplete(blob);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-sm border-blue-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Camera className="w-5 h-5 text-blue-500" />
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="relative rounded-lg overflow-hidden border border-blue-500/20 bg-secondary/50">
            {isImageLoading ? (
              <div className="aspect-square flex flex-col items-center justify-center bg-secondary gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading image...
                </p>
              </div>
            ) : imageSrc ? (
              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  circularCrop
                  aspect={1}
                >
                  <img
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[500px] w-full object-contain"
                  />
                </ReactCrop>
                <div className="absolute inset-0 pointer-events-none border-2 border-blue-500/20 rounded-lg" />
              </div>
            ) : (
              <div className="aspect-square flex flex-col items-center justify-center bg-secondary gap-2">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No image selected</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="hover:bg-blue-500/10 hover:text-blue-500"
            >
              Cancel
            </Button>
            <Button
              onClick={getCroppedImg}
              disabled={isLoading || !completedCrop || isImageLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Save & Apply'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 