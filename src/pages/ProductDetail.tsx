import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, ArrowLeft, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === Number(id));

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
          <div className="bg-secondary rounded-lg overflow-hidden aspect-square">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

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
              <span className="text-muted-foreground">({product.rating})</span>
            </div>

            <p className="text-4xl font-bold text-primary mb-6">
              {formatPrice(product.price)}
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <span className="font-medium">Stock Status:</span>
                <Badge variant={product.inStock ? "default" : "destructive"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
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
              <Button
                size="lg"
                className="w-full text-lg"
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
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
      </div>
    </div>
  );
};

export default ProductDetail;
