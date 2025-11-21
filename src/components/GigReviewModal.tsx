import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { addReview, updateReview } from "@/hooks/useGigs";
import { cn } from "@/lib/utils";

interface GigReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    gigId: string;
    onReviewAdded: () => void;
    initialData?: {
        id: string;
        rating: number;
        comment: string;
    };
}

export function GigReviewModal({ isOpen, onClose, gigId, onReviewAdded, initialData }: GigReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setRating(initialData.rating);
            setComment(initialData.comment);
        } else if (isOpen) {
            setRating(0);
            setComment("");
        }
    }, [isOpen, initialData]);

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateReview(initialData.id, {
                    rating,
                    comment
                });
            } else {
                await addReview({
                    gigId,
                    rating,
                    comment
                });
            }
            onReviewAdded();
            onClose();
            if (!initialData) {
                setRating(0);
                setComment("");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Review' : 'Write a Review'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            "w-8 h-8",
                                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                            id="comment"
                            placeholder="Share your experience with this gig..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={rating === 0 || isSubmitting}>
                        {isSubmitting ? (initialData ? "Updating..." : "Posting...") : (initialData ? "Update Review" : "Post Review")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
