import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Gig } from '@/data/mockGigs';
import { toast } from 'sonner';

interface FetchGigsParams {
    category?: string;
    userId?: string;
    status?: 'active' | 'paused' | 'completed' | 'deleted';
}

export const useGigs = (params?: FetchGigsParams) => {
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGigs = async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from('gigs')
                .select(`
          *,
          gig_images (
            image_url,
            is_primary
          ),
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
                .eq('is_active', true)
                .neq('status', 'deleted')
                .order('created_at', { ascending: false });

            // Apply filters
            if (params?.category) {
                query = query.eq('category', params.category);
            }

            if (params?.userId) {
                query = query.eq('user_id', params.userId);
            }

            if (params?.status) {
                query = query.eq('status', params.status);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setGigs(data || []);
        } catch (err: any) {
            console.error('Error fetching gigs:', err);
            setError(err.message);
            toast.error('Failed to load gigs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGigs();
    }, [params?.category, params?.userId, params?.status]);

    const refetch = () => {
        fetchGigs();
    };

    return { gigs, loading, error, refetch };
};

// Helper function to get a single gig by ID
export const fetchGigById = async (id: string): Promise<Gig | null> => {
    try {
        const { data, error } = await supabase
            .from('gigs')
            .select(`
        *,
        gig_images (
          image_url,
          is_primary
        ),
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (err: any) {
        console.error('Error fetching gig:', err);
        toast.error('Failed to load gig details');
        return null;
    }
};

// Helper to create a gig
export const createGig = async (gigData: {
    title: string;
    description: string;
    category: string;
    price: number;
    location?: string;
    duration?: string;
    tags?: string[];
    images?: string[];
}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to create a gig');

        // Insert gig
        const { data: newGig, error: gigError } = await supabase
            .from('gigs')
            .insert({
                title: gigData.title,
                description: gigData.description,
                category: gigData.category,
                price: gigData.price,
                location: gigData.location || null,
                duration: gigData.duration || null,
                tags: gigData.tags || [],
                user_id: user.id,
                is_active: true,
                status: 'active',
            })
            .select()
            .single();

        if (gigError) throw gigError;

        // Insert images if provided
        if (gigData.images && gigData.images.length > 0) {
            const imageRecords = gigData.images.map((url, index) => ({
                gig_id: newGig.id,
                image_url: url,
                is_primary: index === 0,
            }));

            const { error: imagesError } = await supabase
                .from('gig_images')
                .insert(imageRecords);

            if (imagesError) {
                console.error('Error inserting images:', imagesError);
                // Don't throw - gig was created successfully
            }
        }

        toast.success('Gig created successfully!');
        return newGig;
    } catch (err: any) {
        console.error('Error creating gig:', err);
        toast.error(err.message || 'Failed to create gig');
        throw err;
    }
};

// Helper to update a gig
export const updateGig = async (
    id: string,
    gigData: Partial<{
        title: string;
        description: string;
        category: string;
        price: number;
        location: string;
        duration: string;
        tags: string[];
        status: 'active' | 'paused' | 'completed';
        images: string[];
    }>
) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in');

        // Check if user is admin
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const isAdmin = userRole?.role === 'admin';

        // Prepare update query
        let query = supabase
            .from('gigs')
            .update({
                ...gigData,
                images: undefined, // Remove images from update
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        // If not admin, enforce ownership
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;

        // Handle images if provided
        if (gigData.images) {
            // Delete existing images
            await supabase.from('gig_images').delete().eq('gig_id', id);

            // Insert new images
            if (gigData.images.length > 0) {
                const imageRecords = gigData.images.map((url, index) => ({
                    gig_id: id,
                    image_url: url,
                    is_primary: index === 0,
                }));

                await supabase.from('gig_images').insert(imageRecords);
            }
        }

        toast.success('Gig updated successfully!');
        return data;
    } catch (err: any) {
        console.error('Error updating gig:', err);
        toast.error(err.message || 'Failed to update gig');
        throw err;
    }
};

// Helper to delete a gig
export const deleteGig = async (id: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in');

        // Check if user is admin
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        const isAdmin = userRole?.role === 'admin';

        // Prepare delete query (soft delete)
        let query = supabase
            .from('gigs')
            .update({ status: 'deleted', is_active: false })
            .eq('id', id);

        // If not admin, enforce ownership
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }

        const { error } = await query;

        if (error) throw error;

        toast.success('Gig deleted successfully!');
        return true;
    } catch (err: any) {
        console.error('Error deleting gig:', err);
        toast.error(err.message || 'Failed to delete gig');
        throw err;
    }
};

// Helper to check if user can delete a gig
export const canDeleteGig = async (gigUserId: string): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // User owns the gig
        if (user.id === gigUserId) return true;

        // Check if user is admin
        const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        return userRole?.role === 'admin';
    } catch (err) {
        return false;
    }
};

// Hook for fetching gig applications (as applicant)
export const useGigApplications = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('gig_applications')
                .select(`
          *,
          gigs (*,
            gig_images (image_url, is_primary),
            profiles:user_id (id, first_name, last_name, avatar_url)
          ),
          profiles:applicant_id (id, first_name, last_name, avatar_url)
        `)
                .eq('applicant_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    return { applications, loading, refetch: fetchApplications };
};

// Hook for fetching applications received on your gigs (as gig owner)
export const useReceivedApplications = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Get applications for gigs owned by current user
            const { data, error } = await supabase
                .from('gig_applications')
                .select(`
          *,
          gigs!inner (*,
            gig_images (image_url, is_primary)
          ),
          profiles:applicant_id (id, first_name, last_name, avatar_url, email)
        `)
                .eq('gigs.user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error: any) {
            console.error('Error fetching received applications:', error);
            toast.error('Failed to load received applications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    return { applications, loading, refetch: fetchApplications };
};

// Hook for fetching gig reviews
export const useGigReviews = (gigId?: string) => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        if (!gigId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('gig_reviews')
                .select(`
                    *,
                    profiles:reviewer_id (
                        id,
                        first_name,
                        last_name,
                        avatar_url
                    )
                `)
                .eq('gig_id', gigId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error: any) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [gigId]);

    return { reviews, loading, refetch: fetchReviews };
};

// Helper to add a review
export const addReview = async (reviewData: {
    gigId: string;
    rating: number;
    comment: string;
}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to review');

        const { data, error } = await supabase
            .from('gig_reviews')
            .insert({
                gig_id: reviewData.gigId,
                reviewer_id: user.id,
                rating: reviewData.rating,
                comment: reviewData.comment
            })
            .select()
            .single();

        if (error) throw error;

        toast.success('Review posted successfully!');
        return data;
    } catch (err: any) {
        console.error('Error posting review:', err);
        toast.error(err.message || 'Failed to post review');
        throw err;
    }
};

// Helper to update a review
export const updateReview = async (reviewId: string, reviewData: {
    rating: number;
    comment: string;
}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to update a review');

        const { data, error } = await supabase
            .from('gig_reviews')
            .update({
                rating: reviewData.rating,
                comment: reviewData.comment,
                updated_at: new Date().toISOString()
            })
            .eq('id', reviewId)
            .eq('reviewer_id', user.id) // Ensure ownership
            .select()
            .single();

        if (error) throw error;

        toast.success('Review updated successfully!');
        return data;
    } catch (err: any) {
        console.error('Error updating review:', err);
        toast.error(err.message || 'Failed to update review');
        throw err;
    }
};

// Helper to delete a review
export const deleteReview = async (reviewId: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to delete a review');

        const { error } = await supabase
            .from('gig_reviews')
            .delete()
            .eq('id', reviewId)
            .eq('reviewer_id', user.id); // Ensure ownership

        if (error) throw error;

        toast.success('Review deleted successfully!');
        return true;
    } catch (err: any) {
        console.error('Error deleting review:', err);
        toast.error(err.message || 'Failed to delete review');
        throw err;
    }
};

// Accept an application
export const acceptApplication = async (applicationId: string, message?: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in');

        const updateData: any = {
            status: 'accepted',
            updated_at: new Date().toISOString()
        };

        if (message) {
            updateData.response_message = message;
        }

        const { data, error } = await supabase
            .from('gig_applications')
            .update(updateData)
            .eq('id', applicationId)
            .select(`
                *,
                gigs!inner(user_id)
            `)
            .single();

        if (error) throw error;

        // Verify ownership
        if (data.gigs.user_id !== user.id) {
            throw new Error('You can only accept applications for your own gigs');
        }

        toast.success('Application accepted!');
        return data;
    } catch (err: any) {
        console.error('Error accepting application:', err);
        toast.error(err.message || 'Failed to accept application');
        throw err;
    }
};

// Reject an application
export const rejectApplication = async (applicationId: string, message?: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in');

        const updateData: any = {
            status: 'rejected',
            updated_at: new Date().toISOString()
        };

        if (message) {
            updateData.response_message = message;
        }

        const { data, error } = await supabase
            .from('gig_applications')
            .update(updateData)
            .eq('id', applicationId)
            .select(`
                *,
                gigs!inner(user_id)
            `)
            .single();

        if (error) throw error;

        // Verify ownership
        if (data.gigs.user_id !== user.id) {
            throw new Error('You can only reject applications for your own gigs');
        }

        toast.success('Application rejected');
        return data;
    } catch (err: any) {
        console.error('Error rejecting application:', err);
        toast.error(err.message || 'Failed to reject application');
        throw err;
    }
};

// Helper to apply to a gig
export const applyToGig = async (gigId: string, message: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to apply');

        const { data, error } = await supabase
            .from('gig_applications')
            .insert({
                gig_id: gigId,
                applicant_id: user.id,
                message: message,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('You have already applied to this gig');
            }
            throw error;
        }

        toast.success('Application sent successfully!');
        return data;
    } catch (err: any) {
        console.error('Error applying to gig:', err);
        toast.error(err.message || 'Failed to apply to gig');
        throw err;
    }
};
