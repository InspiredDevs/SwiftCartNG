import { useState } from "react";
import { Link } from "react-router-dom";
import { CartItem as CartItemType } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Star, ShoppingBag } from "lucide-react";

interface CartItemPreviewDialogProps {
  item: CartItemType;
}

const CartItemPreviewDialog = ({ item }: CartItemPreviewDialogProps) => {
  const [open, setOpen] = useState(false);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Product Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Product Image */}
          <div className="w-full aspect-square max-h-64 bg-secondary rounded-lg overflow-hidden">
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">
                {item.rating ? item.rating.toFixed(1) : "No rating"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>
                <p className="text-sm text-muted-foreground">
                  Quantity in cart: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className={item.in_stock ? "text-green-600" : "text-destructive"}>
                {item.in_stock ? `In Stock (${item.stock_quantity} available)` : "Out of Stock"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/product/${item.id}`} className="flex-1">
              <Button className="w-full" onClick={() => setOpen(false)}>
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartItemPreviewDialog;
