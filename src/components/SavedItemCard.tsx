import { Link } from "react-router-dom";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Star } from "lucide-react";

interface SavedItemCardProps {
  item: Product & { savedAt: string };
  onMoveToCart: () => void;
  onRemove: () => void;
}

const SavedItemCard = ({ item, onMoveToCart, onRemove }: SavedItemCardProps) => {
  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-border">
      {/* Product Image */}
      <Link to={`/product/${item.id}`}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        </div>
      </Link>
      
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <Link to={`/product/${item.id}`}>
            <h3 className="font-semibold text-sm sm:text-base truncate hover:text-primary transition-colors">
              {item.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <p className="text-sm sm:text-base font-bold text-primary mt-1">
            {formatPrice(item.price)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {item.rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span>{item.rating.toFixed(1)}</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              Saved {formatDate(item.savedAt)}
            </span>
          </div>
          {!item.in_stock && (
            <span className="text-xs text-destructive">Out of stock</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onMoveToCart}
            disabled={!item.in_stock}
            className="gap-1"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Add to Cart</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SavedItemCard;
