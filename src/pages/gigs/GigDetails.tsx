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
    Calendar
} from "lucide-react";
import { mockGigs, Gig } from "@/data/mockGigs";
import { PageTransition } from "@/components/PageTransition";
import { EditGigModal } from "@/components/EditGigModal";

const GigDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [gig, setGig] = useState<Gig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        // Simulate API fetch
        const fetchGig = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const foundGig = mockGigs.find(g => g.id === id);
            setGig(foundGig || null);
            setLoading(false);
        };
        fetchGig();
    }, [id]);

    const handleContact = () => {
        toast({
            title: "Contact Request Sent",
            description: `You've started a conversation with ${gig?.user_name}`,
        });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: "Link Copied",
            description: "Gig link copied to clipboard",
        });
    };

    const nextImage = () => {
        if (gig?.images && gig.images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % gig.images!.length);
        }
    };

    const prevImage = () => {
        if (gig?.images && gig.images.length > 0) {
            setSelectedImageIndex((prev) => (prev - 1 + gig.images!.length) % gig.images!.length);
        }
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
                                        {(gig.user_id === "current_user" || gig.user_name === "You") && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setIsEditModalOpen(true)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                        <path d="m15 5 4 4" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this gig?")) {
                                                            const index = mockGigs.findIndex(g => g.id === gig.id);
                                                            if (index > -1) {
                                                                mockGigs.splice(index, 1);
                                                                toast({
                                                                    title: "Gig Deleted",
                                                                    description: "Your gig has been deleted successfully",
                                                                });
                                                                navigate('/gigs');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
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
                                {gig.images && gig.images.length > 0 && (
                                    <div className="space-y-3 mb-6">
                                        {/* Main Image with Navigation */}
                                        <div className="relative group">
                                            <img
                                                src={gig.images[selectedImageIndex]}
                                                alt={`${gig.title} - Image ${selectedImageIndex + 1}`}
                                                className="w-full h-64 md:h-80 object-cover rounded-lg"
                                            />

                                            {/* Navigation Arrows - Only show if more than 1 image */}
                                            {gig.images.length > 1 && (
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
                                                        {selectedImageIndex + 1} / {gig.images.length}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail Navigation - Show all images */}
                                        {gig.images.length > 1 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {gig.images.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${selectedImageIndex === index
                                                                ? 'ring-2 ring-primary'
                                                                : 'hover:opacity-80'
                                                            }`}
                                                        onClick={() => setSelectedImageIndex(index)}
                                                    >
                                                        <img
                                                            src={image}
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

                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border-2 border-background">
                                        <AvatarImage src={gig.user_avatar} />
                                        <AvatarFallback>
                                            {gig.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{gig.user_name}</div>
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
                    onGigUpdated={() => {
                        // Refresh gig data after update
                        const updatedGig = mockGigs.find(g => g.id === id);
                        setGig(updatedGig || null);
                    }}
                />
            )}
        </PageTransition>
    );
};

export default GigDetails;
