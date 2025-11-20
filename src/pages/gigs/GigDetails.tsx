import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
    MapPin,
    Clock,
    Star,
    Share2,
    MessageCircle,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Calendar,
    Trash2,
    Edit
} from "lucide-react";
import { Gig } from "@/data/mockGigs";
import { PageTransition } from "@/components/PageTransition";
import { EditGigModal } from "@/components/EditGigModal";
import { fetchGigById, deleteGig, canDeleteGig } from "@/hooks/useGigs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GigDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast: toastFn } = useToast();
    const [gig, setGig] = useState<Gig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [canDelete, setCanDelete] = useState(false);

    useEffect(() => {
        const loadGig = async () => {
            if (!id) return;

            setLoading(true);
            const gigData = await fetchGigById(id);
            setGig(gigData);
            setLoading(false);
        };

        loadGig();
    }, [id]);

    useEffect(() => {
        const checkPermissions = async () => {
            if (gig) {
                const canDel = await canDeleteGig(gig.user_id);
                setCanDelete(canDel);
            }
        };
        checkPermissions();
    }, [gig]);

    const handleContact = async () => {
        if (!gig) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Please sign in to contact the seller');
                navigate('/auth/signin');
                return;
            }

            if (user.id === gig.user_id) {
                toast.error('You cannot contact yourself');
                return;
            }

            // Check if conversation exists
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(buyer_id.eq.${user.id},seller_id.eq.${gig.user_id}),and(buyer_id.eq.${gig.user_id},seller_id.eq.${user.id})`)
                .limit(1)
                .single();

            if (existingConv) {
                navigate(`/messages/${existingConv.id}`);
                return;
            }

            // Create conversation
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    buyer_id: user.id,
                    seller_id: gig.user_id,
                    last_message: `Interested in: ${gig.title}`,
                    last_message_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            navigate(`/messages/${newConv.id}`);
            toast.success('Conversation started!');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Failed to start conversation');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toastFn({
            title: "Link Copied",
            description: "Gig link copied to clipboard",
        });
    };

    const handleDelete = async () => {
        if (!gig) return;

        const confirmed = window.confirm('Are you sure you want to delete this gig?');
        if (!confirmed) return;

        try {
            await deleteGig(gig.id);
            navigate('/gigs');
        } catch (error) {
            console.error('Error deleting gig:', error);
        }
    };

    const nextImage = () => {
        if (gig?.gig_images && gig.gig_images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % gig.gig_images!.length);
        }
    };

    const prevImage = () => {
        if (gig?.gig_images && gig.gig_images.length > 0) {
            setSelectedImageIndex((prev) => (prev - 1 + gig.gig_images!.length) % gig.gig_images!.length);
        }
    };

    const getUserName = () => {
        if (!gig?.profiles) return 'Anonymous';
        const { first_name, last_name } = gig.profiles;
        if (first_name && last_name) return `${first_name} ${last_name}`;
        if (first_name) return first_name;
        return 'Anonymous';
    };

    const getInitials = () => {
        const name = getUserName();
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const refreshGig = async () => {
        if (!id) return;
        const gigData = await fetchGigById(id);
        setGig(gigData);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!gig) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Gig not found</h1>
                <Button onClick={() => navigate('/gigs')}>Back to Gigs</Button>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-background pb-20">
                {/* Header Image/Gradient Area */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-background relative">
                    <div className="absolute top-4 left-4 md:top-8 md:left-8">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/gigs')}
                            className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div>
                                        <Badge variant="secondary" className="mb-3">
                                            {gig.category}
                                        </Badge>
                                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                            {gig.title}
                                        </h1>
                                    </div>
                                    <div className="flex gap-2">
                                        {canDelete && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setIsEditModalOpen(true)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handleDelete}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={handleShare}>
                                            <Share2 className="h-5 w-5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        {gig.location}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        {gig.duration}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-medium text-foreground">{gig.rating}</span>
                                        <span>({gig.reviews_count} reviews)</span>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Image Gallery with Carousel */}
                                {gig.gig_images && gig.gig_images.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        {/* Main Image with Navigation */}
                                        <div className="relative group">
                                            <img
                                                src={gig.gig_images[selectedImageIndex].image_url}
                                                alt={`${gig.title} - Image ${selectedImageIndex + 1}`}
                                                className="w-full h-64 md:h-80 object-cover rounded-lg"
                                            />

                                            {/* Navigation Arrows - Only show if more than 1 image */}
                                            {gig.gig_images.length > 1 && (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={prevImage}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="m15 18-6-6 6-6" />
                                                        </svg>
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={nextImage}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="m9 18 6-6-6-6" />
                                                        </svg>
                                                    </Button>

                                                    {/* Image Counter */}
                                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                                        {selectedImageIndex + 1} / {gig.gig_images.length}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail Navigation - Show all images */}
                                        {gig.gig_images.length > 1 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {gig.gig_images.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${selectedImageIndex === index
                                                            ? 'ring-2 ring-primary'
                                                            : 'hover:opacity-80'
                                                            }`}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                    >
                                                        <img
                                                            src={image.image_url}
                                                            alt={`${gig.title} thumbnail ${index + 1}`}
                                                            className="w-full h-24 object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Separator className="my-6" />

                                <div className="space-y-4">
                                    <h2 className="text-xl font-semibold">About this Gig</h2>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {gig.description}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-sm font-medium mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {gig.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="px-3 py-1">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section (Placeholder) */}
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                                <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No reviews yet for this gig.</p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Price Card */}
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6 sticky top-24">
                                <div className="mb-6">
                                    <div className="text-3xl font-bold text-primary">
                                        ₦{gig.price.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-muted-foreground">per service</div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <Button className="w-full" size="lg" onClick={handleContact}>
                                        <MessageCircle className="mr-2 h-4 w-4" />
                                        Contact Seller
                                    </Button>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <ShieldCheck className="h-3 w-3" />
                                        Secure Payment via Escrow
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80" onClick={() => navigate(`/user-profile/${gig.user_id}`)}>
                                    <Avatar className="h-12 w-12 border-2 border-background">
                                        <AvatarImage src={gig.profiles?.avatar_url || undefined} />
                                        <AvatarFallback>
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{getUserName()}</div>
                                        <div className="text-xs text-muted-foreground">
                                            Joined {new Date(gig.created_at).getFullYear()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-muted/50 p-2 rounded text-center">
                                        <div className="font-medium text-foreground">100%</div>
                                        <div className="text-muted-foreground">Response Rate</div>
                                    </div>
                                    <div className="bg-muted/50 p-2 rounded text-center">
                                        <div className="font-medium text-foreground">2h</div>
                                        <div className="text-muted-foreground">Avg Response</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {gig && (
                <EditGigModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    gigId={gig.id}
                    onGigUpdated={refreshGig}
                />
            )}
        </PageTransition>
    );
};

export default GigDetails;
