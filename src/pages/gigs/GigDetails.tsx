import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    MessageCircle,
    Share2,
    MapPin,
    Clock,
    Star,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    Calendar,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    XCircle
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import { EditGigModal } from "@/components/EditGigModal";
import { GigReviewModal } from "@/components/GigReviewModal";
import { fetchGigById, deleteGig, canDeleteGig, useGigReviews, deleteReview, applyToGig, withdrawApplication } from "@/hooks/useGigs";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const GigDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [gig, setGig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [canDelete, setCanDelete] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [reviewToEdit, setReviewToEdit] = useState<any>(null);
    const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useGigReviews(id);

    const userReview = reviews.find(r => r.reviewer_id === currentUser?.id);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        checkUser();
    }, []);

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

    const [applicationStatus, setApplicationStatus] = useState<{
        id: string;
        status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
        response_message?: string;
        withdrawal_reason?: string;
    } | null>(null);

    const [withdrawDialog, setWithdrawDialog] = useState(false);
    const [withdrawalReason, setWithdrawalReason] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);

    const fetchApplicationStatus = async () => {
        if (!id || !currentUser) return;

        try {
            const { data, error } = await supabase
                .from('gig_applications')
                .select('id, status, response_message, withdrawal_reason')
                .eq('gig_id', id)
                .eq('applicant_id', currentUser.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            setApplicationStatus(data);
        } catch (error) {
            console.error('Error fetching application status:', error);
        }
    };

    useEffect(() => {
        fetchApplicationStatus();
    }, [id, currentUser]);

    const hasApplied = !!applicationStatus;

    const handleApply = async () => {
        if (!gig) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Please sign in to apply');
                navigate('/auth/signin');
                return;
            }

            if (user.id === gig.user_id) {
                toast.error('You cannot apply to your own gig');
                return;
            }

            if (hasApplied) {
                toast.info('You have already applied to this gig');
                navigate('/gigs/applications');
                return;
            }

            // Create Application
            await applyToGig(gig.id, `I'm interested in working on: ${gig.title}`);

            // Refresh status
            await fetchApplicationStatus();
            toast.success('Application submitted! The gig owner will review it.');
        } catch (error: any) {
            console.error('Error:', error);
            // Error is already shown by applyToGig
        }
    };

    const handleReapply = async () => {
        if (!applicationStatus || !gig) return;

        try {
            // Update the withdrawn application back to pending
            const { error } = await supabase
                .from('gig_applications')
                .update({
                    status: 'pending',
                    withdrawal_reason: null, // Clear the withdrawal reason
                    message: `I'm interested in working on: ${gig.title}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', applicationStatus.id);

            if (error) throw error;

            // Refresh status
            await fetchApplicationStatus();
            toast.success('Reapplied successfully!');
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Failed to reapply');
        }
    };

    const handleMessage = async () => {
        if (!gig || !currentUser) return;

        try {
            // Check if conversation exists
            const { data: existingConv } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(buyer_id.eq.${currentUser.id},seller_id.eq.${gig.user_id}),and(buyer_id.eq.${gig.user_id},seller_id.eq.${currentUser.id})`)
                .limit(1)
                .maybeSingle();

            if (existingConv) {
                navigate(`/messages/${existingConv.id}`);
                return;
            }

            // Create new conversation without sending initial message
            const { data: newConv, error } = await supabase
                .from('conversations')
                .insert({
                    buyer_id: currentUser.id,
                    seller_id: gig.user_id,
                    last_message: '',
                    last_message_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            navigate(`/messages/${newConv.id}`);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Failed to start conversation');
        }
    };

    const handleWithdraw = async () => {
        if (!applicationStatus) return;

        try {
            setWithdrawing(true);
            await withdrawApplication(applicationStatus.id, withdrawalReason);

            // Refresh status
            await fetchApplicationStatus();

            // Close dialog and reset
            setWithdrawDialog(false);
            setWithdrawalReason("");
        } catch (error) {
            console.error('Error withdrawing application:', error);
        } finally {
            setWithdrawing(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Gig link copied to clipboard");
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

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            await deleteReview(reviewId);
            refetchReviews();
            refreshGig();
            toast.success('Review deleted');
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const nextImage = () => {
        if (gig?.gig_images && gig.gig_images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % gig.gig_images!.length);
        }
    };

    const prevImage = () => {
        if (gig?.gig_images && gig.gig_images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + gig.gig_images!.length) % gig.gig_images!.length);
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
                                                src={gig.gig_images[currentImageIndex].image_url}
                                                alt={`${gig.title} - Image ${currentImageIndex + 1}`}
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
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={nextImage}
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>

                                                    {/* Image Counter */}
                                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                                        {currentImageIndex + 1} / {gig.gig_images.length}
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
                                                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${currentImageIndex === index
                                                            ? 'ring-2 ring-primary'
                                                            : 'hover:opacity-80'
                                                            }`}
                                                        onClick={() => setCurrentImageIndex(index)}
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

                            {/* Reviews Section */}
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold">Reviews ({reviews.length})</h2>
                                    {currentUser && gig && currentUser.id !== gig.user_id && !userReview && (
                                        <Button variant="outline" onClick={() => {
                                            setReviewToEdit(null);
                                            setIsReviewModalOpen(true);
                                        }}>
                                            Write a Review
                                        </Button>
                                    )}
                                </div>

                                {reviewsLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No reviews yet for this gig.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={review.profiles?.avatar_url} />
                                                            <AvatarFallback>
                                                                {review.profiles?.first_name?.[0] || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">
                                                                {review.profiles?.first_name} {review.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                                                {review.updated_at && new Date(review.updated_at).getTime() > new Date(review.created_at).getTime() + 1000 && (
                                                                    <span className="ml-1 text-muted-foreground/60 italic">(edited)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center">
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                                                            <span className="font-medium">{review.rating}</span>
                                                        </div>
                                                        {currentUser?.id === review.reviewer_id && (
                                                            <div className="flex gap-1 ml-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => {
                                                                        setReviewToEdit(review);
                                                                        setIsReviewModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive"
                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground text-sm mt-2">
                                                    {review.comment}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

                                {/* Only show Apply button if not the gig owner */}
                                {currentUser && currentUser.id !== gig.user_id && (
                                    <div className="space-y-3 mb-6">
                                        {!hasApplied ? (
                                            <>
                                                <Button className="w-full" size="lg" onClick={handleApply}>
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Apply Now
                                                </Button>
                                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Secure Payment via Escrow
                                                </div>
                                            </>
                                        ) : applicationStatus?.status === 'pending' ? (
                                            <>
                                                <Button className="w-full" size="lg" disabled variant="secondary">
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    Applied - Pending Review
                                                </Button>
                                                <Button
                                                    className="w-full"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setWithdrawDialog(true)}
                                                >
                                                    Withdraw Application
                                                </Button>
                                                {applicationStatus.response_message && (
                                                    <div className="text-sm p-3 bg-muted rounded-lg">
                                                        <p className="font-medium mb-1">Message from owner:</p>
                                                        <p className="text-muted-foreground">{applicationStatus.response_message}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : applicationStatus?.status === 'accepted' ? (
                                            <>
                                                <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" onClick={handleMessage}>
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Message Owner
                                                </Button>
                                                <div className="text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <p className="font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Application Accepted!
                                                    </p>
                                                    {applicationStatus.response_message && (
                                                        <p className="text-muted-foreground mt-2">{applicationStatus.response_message}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : applicationStatus?.status === 'rejected' ? (
                                            <>
                                                <Button className="w-full" size="lg" onClick={handleReapply} variant="outline">
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Reapply
                                                </Button>
                                                <div className="text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                    <p className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                                        <XCircle className="h-4 w-4" />
                                                        Application Rejected
                                                    </p>
                                                    {applicationStatus.response_message && (
                                                        <p className="text-muted-foreground mt-2">{applicationStatus.response_message}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : applicationStatus?.status === 'withdrawn' ? (
                                            <>
                                                <Button className="w-full" size="lg" onClick={handleReapply} variant="default">
                                                    <MessageCircle className="mr-2 h-4 w-4" />
                                                    Reapply
                                                </Button>
                                                <div className="text-sm p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                                    <p className="font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                                                        <XCircle className="h-4 w-4" />
                                                        Application Withdrawn
                                                    </p>
                                                    {applicationStatus.withdrawal_reason && (
                                                        <p className="text-muted-foreground mt-2">Reason: {applicationStatus.withdrawal_reason}</p>
                                                    )}
                                                </div>
                                            </>
                                        ) : null}
                                    </div>
                                )}

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

            {/* Add Review Modal */}
            {gig && (
                <GigReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    gigId={gig.id}
                    initialData={reviewToEdit}
                    onReviewAdded={() => {
                        refetchReviews();
                        refreshGig(); // Update gig rating
                    }}
                />
            )}

            {/* Withdrawal Dialog */}
            <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Withdraw Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for withdrawing your application. This will be shared with the gig owner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="E.g., Found another opportunity, Changed my mind, etc."
                            value={withdrawalReason}
                            onChange={(e) => setWithdrawalReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setWithdrawDialog(false);
                                setWithdrawalReason("");
                            }}
                            disabled={withdrawing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleWithdraw}
                            disabled={!withdrawalReason.trim() || withdrawing}
                        >
                            {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTransition>
    );
};

export default GigDetails;
