import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { CartItem, Product } from "@/types/product";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CartContextType {
  cart: CartItem[];
  selectedItems: Set<string>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getSelectedTotal: () => number;
  getSelectedCount: () => number;
  getSelectedItems: () => CartItem[];
  toggleItemSelection: (productId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = 'guest_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from database for logged-in users
  const loadCartFromDB = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            category,
            description,
            in_stock,
            rating,
            stock_quantity,
            seller_id,
            status
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (cartItems) {
        const mappedCart: CartItem[] = cartItems
          .filter(item => item.products)
          .map(item => ({
            id: (item.products as any).id,
            name: (item.products as any).name,
            price: Number((item.products as any).price),
            image_url: (item.products as any).image_url,
            category: (item.products as any).category,
            description: (item.products as any).description,
            in_stock: (item.products as any).in_stock,
            rating: Number((item.products as any).rating),
            stock_quantity: (item.products as any).stock_quantity,
            seller_id: (item.products as any).seller_id,
            status: (item.products as any).status,
            quantity: item.quantity,
          }));
        
        return mappedCart;
      }
      return [];
    } catch (error) {
      console.error('Error loading cart from DB:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart item to database
  const saveCartItemToDB = async (userId: string, productId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id: productId, quantity },
          { onConflict: 'user_id,product_id' }
        );
      if (error) throw error;
    } catch (error) {
      console.error('Error saving cart item to DB:', error);
    }
  };

  // Remove cart item from database
  const removeCartItemFromDB = async (userId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing cart item from DB:', error);
    }
  };

  // Clear cart in database
  const clearCartInDB = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    } catch (error) {
      console.error('Error clearing cart in DB:', error);
    }
  };

  // Get guest cart from localStorage
  const getGuestCart = (): CartItem[] => {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Save guest cart to localStorage
  const saveGuestCart = (cartItems: CartItem[]) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
  };

  // Clear guest cart
  const clearGuestCart = () => {
    localStorage.removeItem(GUEST_CART_KEY);
  };

  // Merge guest cart with DB cart
  const mergeAndSaveCarts = async (userId: string, dbCart: CartItem[], guestCart: CartItem[]) => {
    const mergedCart = [...dbCart];
    
    for (const guestItem of guestCart) {
      const existingIndex = mergedCart.findIndex(item => item.id === guestItem.id);
      if (existingIndex >= 0) {
        // Item exists, update quantity (max of both)
        mergedCart[existingIndex].quantity = Math.max(
          mergedCart[existingIndex].quantity,
          guestItem.quantity
        );
      } else {
        // New item, add to cart
        mergedCart.push(guestItem);
      }
    }

    // Save merged cart to DB
    for (const item of mergedCart) {
      await saveCartItemToDB(userId, item.id, item.quantity);
    }

    // Clear guest cart after merging
    clearGuestCart();

    return mergedCart;
  };

  // Load cart when user changes
  useEffect(() => {
    const initializeCart = async () => {
      if (user?.id) {
        const guestCart = getGuestCart();
        const dbCart = await loadCartFromDB(user.id);
        
        if (guestCart.length > 0) {
          // Merge guest cart with DB cart
          const mergedCart = await mergeAndSaveCarts(user.id, dbCart, guestCart);
          setCart(mergedCart);
        } else {
          setCart(dbCart);
        }
      } else {
        // Not logged in, use guest cart
        setCart(getGuestCart());
      }
    };

    initializeCart();
  }, [user?.id, loadCartFromDB]);

  const addToCart = async (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      let newCart: CartItem[];
      
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
        toast.success("Quantity updated in cart");
      } else {
        newCart = [...prevCart, { ...product, quantity: 1 }];
        toast.success("Added to cart");
      }

      // Save to DB or localStorage
      if (user?.id) {
        const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
        saveCartItemToDB(user.id, product.id, newQuantity);
      } else {
        saveGuestCart(newCart);
      }

      return newCart;
    });
  };

  const removeFromCart = async (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.id !== productId);
      
      if (user?.id) {
        removeCartItemFromDB(user.id, productId);
      } else {
        saveGuestCart(newCart);
      }

      return newCart;
    });
    toast.success("Removed from cart");
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart((prevCart) => {
      const newCart = prevCart.map((item) => 
        item.id === productId ? { ...item, quantity } : item
      );

      if (user?.id) {
        saveCartItemToDB(user.id, productId, quantity);
      } else {
        saveGuestCart(newCart);
      }

      return newCart;
    });
  };

  const clearCart = async () => {
    if (user?.id) {
      await clearCartInDB(user.id);
    } else {
      clearGuestCart();
    }
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getSelectedTotal = () => {
    return cart
      .filter(item => selectedItems.has(item.id))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSelectedCount = () => {
    return cart
      .filter(item => selectedItems.has(item.id))
      .reduce((count, item) => count + item.quantity, 0);
  };

  const getSelectedItems = () => {
    return cart.filter(item => selectedItems.has(item.id));
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(cart.map(item => item.id)));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  // Auto-select new items when added to cart
  useEffect(() => {
    const cartIds = new Set(cart.map(item => item.id));
    // Add any new items to selection
    cart.forEach(item => {
      if (!selectedItems.has(item.id)) {
        setSelectedItems(prev => new Set([...prev, item.id]));
      }
    });
    // Remove selection for items no longer in cart
    setSelectedItems(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (cartIds.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        selectedItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        getSelectedTotal,
        getSelectedCount,
        getSelectedItems,
        toggleItemSelection,
        selectAllItems,
        deselectAllItems,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
