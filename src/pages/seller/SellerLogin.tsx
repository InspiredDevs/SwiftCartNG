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
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded">
              SELLER
            </div>
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SwiftCart NG</span>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In to Seller Portal'}
              </Button>
            </form>
             
             <div className="mt-6 text-center text-sm">
               <Link to="/auth/forgot-password?portal=seller" className="text-primary hover:underline font-medium">
                 Forgot your password?
               </Link>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
