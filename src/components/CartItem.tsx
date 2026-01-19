import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { CartItem as CartItemType } from "@/types/product";
import { useCart } from "@/contexts/CartContext";

interface CartItemProps {
  item: CartItemType;
}

const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeFromCart, selectedItems, toggleItemSelection } = useCart();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const isSelected = selectedItems.has(item.id);

  return (
    <div className={`flex gap-3 sm:gap-4 py-4 border-b border-border transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
      {/* Selection Checkbox */}
      <div className="flex items-center">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => toggleItemSelection(item.id)}
        />
      </div>

      {/* Product Image */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
      </div>
      
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm sm:text-base font-bold text-primary">{formatPrice(item.price)}</p>
            <span className="text-xs text-muted-foreground">×{item.quantity}</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-foreground">
            = {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 bg-secondary rounded-lg p-0.5 sm:p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
            onClick={() => removeFromCart(item.id)}
          >
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
