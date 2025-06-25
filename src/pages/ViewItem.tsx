// ViewItem.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { User, ArrowLeft, Mail, Lock, Loader2, Github, ShieldCheck, Users, Copy, CheckCircle, AlertTriangle, MessageSquare, Phone, MapPin, MoreHorizontal, Heart, Share2, Flag, Edit, Trash2, Loader, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import { formatTimeToNow } from "@/lib/utils";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/components/ui/use-toast";
import { useSearch } from "@/contexts/SearchContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useDeviceType } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReportDialog } from "@/components/ReportDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { useTheme } from "@/contexts/ThemeContext";

const LazyViewItem = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isContactInfoLoading, setIsContactInfoLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ phone?: string; email?: string }>({});
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setItemForEdit } = useSearch();
  const deviceType = useDeviceType();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchItem = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!id) {
          throw new Error("Item ID is missing.");
        }

        const { data, error } = await supabase
          .from("items")
          .select(`
            *,
            profiles (
              id,
              full_name,
              avatar_url,
              phone,
              email
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error("Item not found.");
        }

        setItem(data);
        setSellerProfile(data.profiles);
        setIsOwner(user?.id === data.user_id);

        // Check if the item is saved
        if (user) {
          const { data: savedData, error: savedError } = await supabase
            .from("saved_items")
            .select("*")
            .eq("user_id", user.id)
            .eq("item_id", id);

          if (savedError) {
            throw savedError;
          }

          setIsSaved(savedData && savedData.length > 0);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching item:", err);
        toast({
          title: "Error",
          description: "Failed to load item. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [id, user, toast]);

  useEffect(() => {
    const getProfile = async () => {
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profileData);
      }
    };

    getProfile();
  }, [user]);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleSaveItem = async () => {
    setIsSaving(true);
    try {
      if (!user) {
        navigate("/auth/signin");
        return;
      }

      if (isSaved) {
        // Remove from saved items
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", id);

        if (error) {
          throw error;
        }

        setIsSaved(false);
        toast({
          title: "Item unsaved",
          description: "This item has been removed from your saved items.",
        });
      } else {
        // Add to saved items
        const { error } = await supabase
          .from("saved_items")
          .insert([{ user_id: user.id, item_id: id }]);

        if (error) {
          throw error;
        }

        setIsSaved(true);
        toast({
          title: "Item saved",
          description: "This item has been added to your saved items.",
        });
      }
    } catch (err: any) {
      console.error("Error saving item:", err);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);

      if (error) {
        throw error;
      }

      toast({
        title: "Item deleted",
        description: "This item has been successfully deleted.",
      });
      navigate("/my-listings");
    } catch (err: any) {
      console.error("Error deleting item:", err);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditItem = () => {
    if (item) {
      setItemForEdit(item);
      navigate("/share");
    }
  };

  const handleGetContactInfo = async () => {
    setIsContactInfoLoading(true);
    try {
      if (!sellerProfile) {
        throw new Error("Seller profile not found.");
      }

      // Simulate fetching contact info (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setContactInfo({
        phone: sellerProfile.phone || "N/A",
        email: sellerProfile.email || "N/A",
      });
      setShowContactInfo(true);
    } catch (err: any) {
      console.error("Error fetching contact info:", err);
      toast({
        title: "Error",
        description: "Failed to retrieve contact information.",
        variant: "destructive",
      });
    } finally {
      setIsContactInfoLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setIsImageDialogOpen(false);
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? (item.images?.length || 0) - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === (item.images?.length || 0) - 1 ? 0 : prevIndex + 1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Item not found.
      </div>
    );
  }

  return (
    <div className="container relative py-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-3 left-3 group relative px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white border border-blue-500/30 hover:border-blue-500/70"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="relative flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="relative">Back</span>
        </div>
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {item.images && item.images.length > 0 && (
          <div className="mb-8">
            <ImageCarousel 
              images={item.images} 
              aspectRatio="square"
            />
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold mb-2">{item.title}</h1>
          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary">{item.condition}</Badge>
            <Badge>{item.category}</Badge>
          </div>
          <p className="text-gray-400 mb-4">
            Posted {formatTimeToNow(item.created_at)}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-semibold">${item.price}</span>
            <div className="flex items-center space-x-2">
              {/* Save Button */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleSaveItem}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSaved ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                {isSaved ? "Unsave" : "Save"}
              </Button>

              {/* Share Button */}
              <Button variant="outline" onClick={() => setIsSharing(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-500">
              {showFullDescription
                ? item.description
                : `${item.description?.substring(0, 200)}...`}
              {!showFullDescription && item.description?.length > 200 && (
                <button
                  className="text-blue-500 hover:underline ml-1"
                  onClick={toggleDescription}
                >
                  Read More
                </button>
              )}
              {showFullDescription && item.description?.length > 200 && (
                <button
                  className="text-blue-500 hover:underline ml-1"
                  onClick={toggleDescription}
                >
                  Show Less
                </button>
              )}
            </p>
          </div>

          <Separator className="mb-4" />

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Seller Information</h2>
            <div className="flex items-center space-x-4">
              <Avatar>
                {sellerProfile?.avatar_url ? (
                  <AvatarImage src={sellerProfile.avatar_url} alt={sellerProfile?.full_name} />
                ) : (
                  <AvatarFallback>{sellerProfile?.full_name?.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-semibold">{sellerProfile?.full_name}</p>
                <p className="text-sm text-gray-500">
                  {/* Display location or other relevant info */}
                  {item.location || "Location not specified"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleGetContactInfo}
              disabled={showContactInfo || isContactInfoLoading}
            >
              {isContactInfoLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Contact Info...
                </>
              ) : showContactInfo ? (
                "Contact Info Shown"
              ) : (
                "Get Contact Info"
              )}
            </Button>

            {showContactInfo && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  <Phone className="h-4 w-4 inline-block mr-1" />
                  Phone: {contactInfo.phone || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  <Mail className="h-4 w-4 inline-block mr-1" />
                  Email: {contactInfo.email || "N/A"}
                </p>
              </div>
            )}
          </div>

          <Separator className="mb-4" />

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            {isOwner ? (
              <>
                <Button
                  className="w-full"
                  onClick={handleEditItem}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setIsDialogOpen(true)}>
                <Flag className="h-4 w-4 mr-2" />
                Report Item
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleDeleteItem}
        isLoading={isDeleting}
      />

      {/* Report Dialog */}
      <ReportDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        itemId={id}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={isSharing}
        onOpenChange={setIsSharing}
        item={item}
      />

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={handleCloseImageDialog}>
        <DialogContent className="sm:max-w-[80%] md:max-w-[60%] lg:max-w-[40%] bg-background border border-input rounded-md p-4">
          <div className="relative">
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[selectedImageIndex]}
                alt={`Full size ${selectedImageIndex + 1}`}
                className="w-full rounded-md aspect-square object-contain"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseImageDialog}
              className="absolute top-2 right-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LazyViewItem;
