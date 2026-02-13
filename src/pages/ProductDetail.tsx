import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, ArrowLeft, Package, Store, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import ProductReviews from "@/components/ProductReviews";
import ProductDetailSkeleton from "@/components/skeletons/ProductDetailSkeleton";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === id);
  const [sellerInfo, setSellerInfo] = useState<{ name: string; isOfficial: boolean } | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product?.seller_id) {
      fetchSellerInfo(product.seller_id);
    }
  }, [product]);

  const fetchSellerInfo = async (sellerId: string) => {
    try {
      const { data: storeData } = await supabase
        .from('seller_stores')
        .select('store_name')
        .eq('user_id', sellerId)
        .maybeSingle();

      if (storeData) {
        setSellerInfo({ name: storeData.store_name, isOfficial: false });
      } else {
        setSellerInfo({ name: 'SwiftCart Official Store', isOfficial: true });
      }
    } catch (error) {
      console.error('Error fetching seller info:', error);
      setSellerInfo({ name: 'SwiftCart Official Store', isOfficial: true });
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/shop">
            <Button>Return to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <PageTransition>
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link to="/shop">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-secondary rounded-lg overflow-hidden aspect-square"
          >
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Product Info */}
          <div>
            <Badge className="mb-4">{product.category}</Badge>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-primary text-primary"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">({Math.round(product.rating * 10) / 10})</span>
            </div>

            <p className="text-4xl font-bold text-primary mb-6">
              {formatPrice(product.price)}
            </p>

            {sellerInfo && (
              <div className="mb-6 flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <Store className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Sold by</p>
                  <p className="font-medium">
                    {sellerInfo.name}
                    {sellerInfo.isOfficial && (
                      <Badge variant="secondary" className="ml-2">Official</Badge>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <span className="font-medium">Stock Status:</span>
                <Badge variant={product.in_stock ? "default" : "destructive"}>
                  {product.in_stock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Product Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {product.stock_quantity !== null && product.stock_quantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity} available
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="w-full text-lg"
                onClick={() => {
                  for (let i = 0; i < quantity; i++) {
                    addToCart(product);
                  }
                }}
                disabled={!product.in_stock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.in_stock ? `Add ${quantity} to Cart` : "Out of Stock"}
              </Button>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
                  <Package className="h-6 w-6 mb-2" />
                  <span className="text-center">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
                  <Package className="h-6 w-6 mb-2" />
                  <span className="text-center">Quality Assured</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg">
                  <Package className="h-6 w-6 mb-2" />
                  <span className="text-center">Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews productId={product.id} productRating={product.rating} />
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default ProductDetail;
