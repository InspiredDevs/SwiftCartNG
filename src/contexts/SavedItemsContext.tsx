import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SavedItem extends Product {
  savedAt: string;
}

interface SavedItemsContextType {
  savedItems: SavedItem[];
  saveForLater: (product: Product) => Promise<void>;
  moveToCart: (productId: string) => Promise<void>;
  removeSavedItem: (productId: string) => Promise<void>;
  isLoading: boolean;
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

const GUEST_SAVED_KEY = 'guest_saved_items';

export const SavedItemsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedItemsFromDB = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: items, error } = await supabase
        .from('saved_items')
        .select(`
          id,
          product_id,
          created_at,
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

      if (items) {
        const mappedItems: SavedItem[] = items
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
            savedAt: item.created_at,
          }));
        return mappedItems;
      }
      return [];
    } catch (error) {
      console.error('Error loading saved items from DB:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGuestSavedItems = (): SavedItem[] => {
    const saved = localStorage.getItem(GUEST_SAVED_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  };

  const saveGuestItems = (items: SavedItem[]) => {
    localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(items));
  };

  useEffect(() => {
    const initializeSavedItems = async () => {
      if (user?.id) {
        const dbItems = await loadSavedItemsFromDB(user.id);
        setSavedItems(dbItems);
      } else {
        setSavedItems(getGuestSavedItems());
      }
    };

    initializeSavedItems();
  }, [user?.id, loadSavedItemsFromDB]);

  const saveForLater = async (product: Product) => {
    const newItem: SavedItem = { ...product, savedAt: new Date().toISOString() };

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('saved_items')
          .upsert(
            { user_id: user.id, product_id: product.id },
            { onConflict: 'user_id,product_id' }
          );
        if (error) throw error;
      } catch (error) {
        console.error('Error saving item to DB:', error);
        toast.error('Failed to save item');
        return;
      }
    } else {
      const current = getGuestSavedItems();
      if (!current.find(item => item.id === product.id)) {
        saveGuestItems([...current, newItem]);
      }
    }

    setSavedItems(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, newItem];
    });
    
    toast.success('Saved for later');
  };

  const moveToCart = async (productId: string) => {
    // This will be called from Cart component which has access to addToCart
    await removeSavedItem(productId);
  };

  const removeSavedItem = async (productId: string) => {
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) throw error;
      } catch (error) {
        console.error('Error removing saved item from DB:', error);
        toast.error('Failed to remove item');
        return;
      }
    } else {
      const current = getGuestSavedItems();
      saveGuestItems(current.filter(item => item.id !== productId));
    }

    setSavedItems(prev => prev.filter(item => item.id !== productId));
  };

  return (
    <SavedItemsContext.Provider
      value={{
        savedItems,
        saveForLater,
        moveToCart,
        removeSavedItem,
        isLoading,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider");
  }
  return context;
};
