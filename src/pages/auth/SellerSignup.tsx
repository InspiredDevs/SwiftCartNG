import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Store } from 'lucide-react';

export default function SellerSignup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword || !storeName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      // Create seller account
      const { error: signUpError } = await signUp(email, password, fullName, 'seller');
      
      if (signUpError) {
        toast.error(signUpError.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.user) {
        toast.error('Account created but failed to sign in. Please try logging in.');
        navigate('/auth/login');
        setLoading(false);
        return;
      }

      // Create seller store
      const { error: storeError } = await supabase
        .from('seller_stores')
        .insert({
          user_id: signInData.user.id,
          store_name: storeName,
          store_description: storeDescription || null,
          is_approved: false,
        });

      if (storeError) {
        toast.error('Account created but failed to create store. Please contact support.');
        navigate('/seller/dashboard');
        setLoading(false);
        return;
      }

      toast.success('Seller account created! Awaiting admin approval to start selling.');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-emerald-500/5">
      <header className="p-4 border-b bg-emerald-500/10">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded">
              SELLER
            </div>
            <Store className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold">SwiftCart NG</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md border-emerald-500/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Become a Seller</CardTitle>
            <CardDescription className="text-center">
              Register your store on SwiftCart NG
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                type="text"
                placeholder="My Awesome Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeDescription">Store Description (Optional)</Label>
              <Textarea
                id="storeDescription"
                placeholder="Tell customers about your store..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              Note: Your seller account will be pending approval. You'll be able to add products once an admin approves your store.
            </div>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Seller Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have a seller account?{' '}
              <Link to="/seller/login" className="text-emerald-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
