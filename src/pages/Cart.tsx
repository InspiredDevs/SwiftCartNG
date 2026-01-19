import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CartItem from "@/components/CartItem";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBag } from "lucide-react";

const Cart = () => {
  const { 
    cart, 
    selectedItems,
    getCartTotal, 
    getSelectedTotal,
    getSelectedCount,
    selectAllItems,
    deselectAllItems 
  } = useCart();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const allSelected = cart.length > 0 && selectedItems.size === cart.length;
  const someSelected = selectedItems.size > 0 && selectedItems.size < cart.length;
  const hasSelectedItems = selectedItems.size > 0;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to get started!</p>
          <Link to="/shop">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  Cart Items ({cart.length})
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllItems();
                        } else {
                          deselectAllItems();
                        }
                      }}
                      className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                    <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                      Select all
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected items</span>
                  <span className="font-medium">{getSelectedCount()} of {cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal (selected)</span>
                  <span className="font-medium">{formatPrice(getSelectedTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cart total</span>
                  <span className="font-medium text-muted-foreground">{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary">{formatPrice(getSelectedTotal())}</span>
                  </div>
                </div>
              </div>

              <Link to="/checkout">
                <Button size="lg" className="w-full" disabled={!hasSelectedItems}>
                  {hasSelectedItems 
                    ? `Proceed to Checkout (${getSelectedCount()} items)`
                    : "Select items to checkout"
                  }
                </Button>
              </Link>

              <Link to="/shop">
                <Button variant="outline" className="w-full mt-4">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
