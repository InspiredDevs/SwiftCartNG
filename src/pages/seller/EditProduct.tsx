import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, X, ImagePlus } from 'lucide-react';
import SellerHeader from '@/components/seller/SellerHeader';

export default function EditProduct() {
  const { id } = useParams();
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock_quantity: '',
    in_stock: true,
    image_url: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || !isSeller)) {
      navigate('/auth/login');
    }
  }, [user, isSeller, authLoading, navigate]);

  useEffect(() => {
    if (user && isSeller && id) {
      fetchProduct();
    }
  }, [user, isSeller, id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user?.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Product not found or you do not have permission to edit it');
        navigate('/seller/products');
        return;
      }

      setFormData({
        name: data.name,
        price: data.price.toString(),
        category: data.category,
        description: data.description || '',
        stock_quantity: (data.stock_quantity || 0).toString(),
        in_stock: data.in_stock ?? true,
        image_url: data.image_url || '',
      });
      setImagePreview(data.image_url || '');
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/seller/products');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(formData.image_url);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `seller-${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const newImageUrl = await uploadImage();
        if (newImageUrl) {
          imageUrl = newImageUrl;
        }
      }

      const stockQty = parseInt(formData.stock_quantity);
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          price: parseFloat(formData.price),
          category: formData.category,
          description: formData.description,
          stock_quantity: stockQty,
          in_stock: stockQty > 0 && formData.in_stock,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast.success('Product updated successfully!');
      navigate('/seller/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SellerHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/products')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                      {imagePreview ? (
                        <>
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          {imageFile && (
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <label className="flex-1">
                      <div className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                        <div className="text-center">
                          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to change image</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Watches">Watches</SelectItem>
                      <SelectItem value="Speakers">Speakers</SelectItem>
                      <SelectItem value="Clothes">Clothes</SelectItem>
                      <SelectItem value="Shoes">Shoes</SelectItem>
                      <SelectItem value="Lunchboxes">Lunchboxes</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="in_stock">Product Available</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle off to temporarily hide this product from the store
                    </p>
                  </div>
                  <Switch
                    id="in_stock"
                    checked={formData.in_stock}
                    onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
