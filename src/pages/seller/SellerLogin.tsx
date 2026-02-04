import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

export default function SellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-500/5">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || 'Invalid email or password');
    } else {
      toast.success('Login successful!');
      // Navigation is handled by useAuth based on role
    }
    
    setLoading(false);
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
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-500/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Seller Portal</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your store and products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seller@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Seller Portal'}
              </Button>
            </form>
            
            <div className="mt-6 space-y-2 text-center text-sm">
              <p className="text-muted-foreground">
                Want to become a seller?{' '}
                <Link to="/auth/signup/seller" className="text-emerald-600 hover:underline font-medium">
                  Register as Seller
                </Link>
              </p>
              <p className="text-muted-foreground text-xs mt-4">
                Are you a customer?{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Customer Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
