import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  productRating: number;
}

export default function ProductReviews({ productId, productRating }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const { data: reviewData, error } = await supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, user_id')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (reviewData || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .maybeSingle();

          return {
            ...review,
            profiles: { full_name: profile?.full_name || 'Anonymous' }
          };
        })
      );

      setReviews(reviewsWithProfiles || []);
      
      // Check if current user has already reviewed
      if (user) {
        const userReview = reviewsWithProfiles?.find(r => r.user_id === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('user_purchased_product', {
          p_user_id: user.id,
          p_product_id: productId
        });

      if (error) throw error;
      setCanReview(data);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    if (!reviewText.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          order_id: '00000000-0000-0000-0000-000000000000',
          rating,
          review_text: reviewText.trim(),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this product');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted successfully!');
        setReviewText('');
        setRating(5);
        fetchReviews();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (count: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= count ? 'fill-primary text-primary' : 'text-muted'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        <div className="flex items-center gap-4 mb-6">
          {renderStars(Math.round(productRating))}
          <span className="text-lg font-medium">
            {reviews.length === 0 ? 'No ratings yet' : `${productRating.toFixed(1)} out of 5`}
          </span>
          <span className="text-muted-foreground">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {user && canReview && !hasReviewed && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                {renderStars(rating, true, setRating)}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {user && !canReview && !hasReviewed && (
        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          You can only review products you have purchased and received.
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className="text-muted-foreground">{review.review_text}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
