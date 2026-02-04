import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    store_name: string;
    store_description: string | null;
  } | null;
  onSuccess: () => void;
}

export default function EditStoreDialog({ 
  open, 
  onOpenChange, 
  store, 
  onSuccess 
}: EditStoreDialogProps) {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (store) {
      setStoreName(store.store_name);
      setStoreDescription(store.store_description || '');
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      toast.error('Store name is required');
      return;
    }

    if (!store) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('seller_stores')
        .update({
          store_name: storeName.trim(),
          store_description: storeDescription.trim() || null,
        })
        .eq('id', store.id);

      if (error) throw error;
      
      toast.success('Store information updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Failed to update store information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Store Information</DialogTitle>
          <DialogDescription>
            Update your store name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Awesome Store"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDescription">Store Description</Label>
              <Textarea
                id="storeDescription"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Tell customers about your store..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
