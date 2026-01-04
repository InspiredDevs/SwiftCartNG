import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Package, MessageSquare, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ProductToReview {
  product_id: string;
  product_name: string;
  product_image: string | null;
  order_id: string;
  order_code: string;
  delivered_at: string;
}

interface MyReview {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
  order_code: string;
}

const MyReviews = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get("order") ?? searchParams.get("order_id");

  const [productsToReview, setProductsToReview] = useState<ProductToReview[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number; text: string }>>({});
  const [expandedSection, setExpandedSection] = useState<"awaiting" | "reviews" | null>("awaiting");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.email) return;

    try {
      // Fetch delivered orders for this user (handle different casing)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          updated_at,
          status,
          order_items (
            product_name
          )
        `
        )
        .eq("customer_email", user.email)
        .in("status", ["Delivered", "delivered"]);

      if (ordersError) throw ordersError;

      // Fetch user's existing reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id);

      if (reviewsError) throw reviewsError;

      // If we arrived via an email deep-link, validate the order status/ownership
      // and provide correct UX feedback.
      if (highlightOrderId) {
        const isInDeliveredList = (orders || []).some((o) => o.id === highlightOrderId);

        if (!isInDeliveredList) {
          const { data: linkedOrder, error: linkedOrderError } = await supabase
            .from("orders")
            .select("id, status")
            .eq("id", highlightOrderId)
            .eq("customer_email", user.email)
            .maybeSingle();

          if (!linkedOrderError) {
            if (!linkedOrder) {
              toast.error("Order not found");
            } else if ((linkedOrder.status || "").toLowerCase() !== "delivered") {
              toast.info("Review available after delivery");
            }
          }
        }
      }

      // Collect all product names from delivered orders
      const productNames = new Set<string>();
      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          productNames.add(item.product_name);
        });
      });

      // Also collect product_ids from existing reviews so "My Reviews" never breaks
      // even if the delivered orders query returns 0 rows.
      const reviewProductIds = Array.from(new Set((reviews || []).map((r: any) => r.product_id)));

      const [productsByNameRes, productsByIdRes] = await Promise.all([
        productNames.size > 0
          ? supabase
              .from("products")
              .select("id, name, image_url")
              .in("name", Array.from(productNames))
          : Promise.resolve({ data: [], error: null }),
        reviewProductIds.length > 0
          ? supabase
              .from("products")
              .select("id, name, image_url")
              .in("id", reviewProductIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (productsByNameRes.error) throw productsByNameRes.error;
      if (productsByIdRes.error) throw productsByIdRes.error;

      // Merge and de-dupe products
      const allProductsRaw = [
        ...(productsByNameRes.data || []),
        ...(productsByIdRes.data || []),
      ] as Array<{ id: string; name: string; image_url: string | null }>;

      const productById = new Map(allProductsRaw.map((p) => [p.id, p]));
      const allProducts = Array.from(productById.values());
      const productMap = new Map(allProducts.map((p) => [p.name, { id: p.id, image_url: p.image_url }]));

      // Build products awaiting review (exclude already reviewed)
      const reviewedProductOrders = new Set(
        (reviews || []).map((r: any) => `${r.product_id}-${r.order_id}`)
      );

      const awaiting: ProductToReview[] = [];
      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const product = productMap.get(item.product_name);
          if (!product) return;

          const key = `${product.id}-${order.id}`;
          if (!reviewedProductOrders.has(key)) {
            awaiting.push({
              product_id: product.id,
              product_name: item.product_name,
              product_image: product.image_url,
              order_id: order.id,
              order_code: order.order_code,
              delivered_at: order.updated_at,
            });
          }
        });
      });

      // Build my reviews with product info
      const orderCodeById = new Map((orders || []).map((o: any) => [o.id, o.order_code]));
      const myReviewsList: MyReview[] = (reviews || [])
        .map((review: any) => {
          const product = productById.get(review.product_id);
          if (!product) return null;

          return {
            id: review.id,
            product_id: review.product_id,
            product_name: product.name,
            product_image: product.image_url,
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
            order_code: orderCodeById.get(review.order_id) || "Unknown",
          } satisfies MyReview;
        })
        .filter(Boolean) as MyReview[];

      setProductsToReview(awaiting);
      setMyReviews(
        myReviewsList.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );

      // Auto-switch to "My Reviews" when arriving via deep-link and nothing is eligible.
      if (highlightOrderId) {
        const hasAwaitingForOrder = awaiting.some((a) => a.order_id === highlightOrderId);
        const hasAnyReviewForOrder = (reviews || []).some((r: any) => r.order_id === highlightOrderId);
        if (!hasAwaitingForOrder && hasAnyReviewForOrder) {
          setExpandedSection("reviews");
        }
      }

      // Initialize forms
      const forms: Record<string, { rating: number; text: string }> = {};
      awaiting.forEach((p) => {
        forms[`${p.product_id}-${p.order_id}`] = { rating: 5, text: "" };
      });
      setReviewForms(forms);
    } catch (error) {
      console.error("Error fetching review data:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (productId: string, orderId: string) => {
    const key = `${productId}-${orderId}`;
    const form = reviewForms[key];
    
    if (!form || form.rating < 1) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(key);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user!.id,
          order_id: orderId,
          rating: form.rating,
          review_text: form.text.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this product for this order');
        } else {
          throw error;
        }
      } else {
        toast.success('Review submitted successfully!');
        fetchData();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(null);
    }
  };

  const updateForm = (key: string, field: 'rating' | 'text', value: number | string) => {
    setReviewForms(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (
    count: number, 
    interactive: boolean = false, 
    onChange?: (rating: number) => void,
    size: 'sm' | 'md' = 'md'
  ) => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= count ? 'fill-primary text-primary' : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onChange?.(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">My Reviews</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/4 mb-4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Reviews</h1>

        {/* Awaiting Review Section */}
        <Card className="mb-6">
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'awaiting' ? null : 'awaiting')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Awaiting Review</CardTitle>
                <Badge variant="secondary">{productsToReview.length}</Badge>
              </div>
              {expandedSection === 'awaiting' ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          
          {expandedSection === 'awaiting' && (
            <CardContent>
              {productsToReview.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No products awaiting review</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reviews can be left after your order is delivered
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {productsToReview.map((product) => {
                    const key = `${product.product_id}-${product.order_id}`;
                    const form = reviewForms[key] || { rating: 5, text: '' };
                    const isHighlighted = highlightOrderId === product.order_id;
                    
                    return (
                      <div 
                        key={key} 
                        className={`border rounded-lg p-4 ${isHighlighted ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="flex gap-4">
                          <Link to={`/product/${product.product_id}`}>
                            <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {product.product_image ? (
                                <img 
                                  src={product.product_image} 
                                  alt={product.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </Link>
                          
                          <div className="flex-1">
                            <Link to={`/product/${product.product_id}`}>
                              <h4 className="font-medium hover:text-primary transition-colors">
                                {product.product_name}
                              </h4>
                            </Link>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>Order: {product.order_code}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Delivered {formatDate(product.delivered_at)}
                              </span>
                            </div>
                            
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="text-sm font-medium mb-1 block">Your Rating</label>
                                {renderStars(form.rating, true, (rating) => updateForm(key, 'rating', rating))}
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-1 block">Your Review (optional)</label>
                                <Textarea
                                  value={form.text}
                                  onChange={(e) => updateForm(key, 'text', e.target.value)}
                                  placeholder="Share your experience with this product..."
                                  rows={3}
                                  className="resize-none"
                                />
                              </div>
                              <Button
                                onClick={() => handleSubmitReview(product.product_id, product.order_id)}
                                disabled={submitting === key}
                                size="sm"
                              >
                                {submitting === key ? 'Submitting...' : 'Submit Review'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* My Reviews Section */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'reviews' ? null : 'reviews')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">My Reviews</CardTitle>
                <Badge variant="secondary">{myReviews.length}</Badge>
              </div>
              {expandedSection === 'reviews' ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          
          {expandedSection === 'reviews' && (
            <CardContent>
              {myReviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">You haven't written any reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4">
                      <div className="flex gap-4">
                        <Link to={`/product/${review.product_id}`}>
                          <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            {review.product_image ? (
                              <img 
                                src={review.product_image} 
                                alt={review.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link to={`/product/${review.product_id}`}>
                                <h4 className="font-medium hover:text-primary transition-colors">
                                  {review.product_name}
                                </h4>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStars(review.rating, false, undefined, 'sm')}
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(review.created_at)}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Order: {review.order_code}
                            </Badge>
                          </div>
                          {review.review_text && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {review.review_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MyReviews;
