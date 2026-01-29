import { Link } from "react-router-dom";
import { ShoppingCart, Star, GitCompare, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useCompare } from "@/contexts/CompareContext";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToCompare, isInCompare } = useCompare();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const inCompare = isInCompare(product.id);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow relative">
        {/* Compare Button */}
        <Button
          variant={inCompare ? "default" : "secondary"}
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            addToCompare(product);
          }}
        >
          {inCompare ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
        </Button>

        <Link to={`/product/${product.id}`}>
          <div className="aspect-square overflow-hidden bg-secondary">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
        <CardContent className="p-4">
          <Link to={`/product/${product.id}`}>
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm text-muted-foreground">{Math.round(product.rating * 10) / 10}</span>
          </div>
          <p className="text-xl font-bold text-primary">{formatPrice(product.price)}</p>
          {!product.in_stock && (
            <p className="text-sm text-destructive font-medium mt-1">Out of Stock</p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={() => addToCart(product)}
            disabled={!product.in_stock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProductCard;
