import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Store, User, Mail, Phone, Calendar, Package } from 'lucide-react';

interface SellerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string | null;
}

interface SellerDetail {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  is_approved: boolean;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  product_count: number;
}

export default function SellerDetailDialog({ 
  open, 
  onOpenChange, 
  sellerId 
}: SellerDetailDialogProps) {
  const [seller, setSeller] = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sellerId) {
      fetchSellerDetails();
    }
  }, [open, sellerId]);

  const fetchSellerDetails = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      // Fetch seller store
      const { data: storeData, error: storeError } = await supabase
        .from('seller_stores')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (storeError) throw storeError;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', storeData.user_id)
        .single();

      // Fetch product count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', storeData.user_id);

      setSeller({
        ...storeData,
        profile: profileData || undefined,
        product_count: count || 0,
      });
    } catch (error) {
      console.error('Error fetching seller details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Seller Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this seller
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : seller ? (
          <div className="space-y-6">
            {/* Store Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Store Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Store Name</span>
                  <span className="font-medium">{seller.store_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {seller.is_approved ? (
                    <Badge className="bg-green-500">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
                {seller.store_description && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Description</span>
                    <p className="text-sm bg-muted p-2 rounded">{seller.store_description}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Owner Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Owner Information
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{seller.profile?.full_name || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{seller.profile?.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="font-medium">{seller.profile?.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Package className="h-4 w-4" />
                    Products
                  </div>
                  <p className="text-2xl font-bold mt-1">{seller.product_count}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Joined
                  </div>
                  <p className="text-sm font-medium mt-1">
                    {new Date(seller.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* User ID for reference */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              User ID: <code className="bg-muted px-1 rounded">{seller.user_id}</code>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">No seller found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
