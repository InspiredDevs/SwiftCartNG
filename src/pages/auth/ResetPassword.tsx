 import { useState, useEffect } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { toast } from 'sonner';
 import { ShoppingCart, Lock, CheckCircle, XCircle } from 'lucide-react';
 
 export default function ResetPassword() {
   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const navigate = useNavigate();
 
   useEffect(() => {
     // Check if we have access token in URL (user clicked reset link)
     const hashParams = new URLSearchParams(window.location.hash.substring(1));
     const accessToken = hashParams.get('access_token');
     const type = hashParams.get('type');
     
     if (!accessToken || type !== 'recovery') {
       setError('Invalid or expired reset link. Please request a new one.');
     }
   }, []);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!password || !confirmPassword) {
       toast.error('Please fill in all fields');
       return;
     }
 
     if (password.length < 6) {
       toast.error('Password must be at least 6 characters');
       return;
     }
 
     if (password !== confirmPassword) {
       toast.error('Passwords do not match');
       return;
     }
 
     setLoading(true);
     
     try {
       const { error } = await supabase.auth.updateUser({
         password: password
       });
       
       if (error) {
         toast.error(error.message || 'Failed to reset password');
       } else {
         setSuccess(true);
         toast.success('Password reset successfully!');
         // Sign out and redirect to login after a delay
         setTimeout(async () => {
           await supabase.auth.signOut();
           navigate('/auth/login');
         }, 3000);
       }
     } catch (err) {
       toast.error('An unexpected error occurred');
     } finally {
       setLoading(false);
     }
   };
 
   if (error) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <header className="p-4 border-b">
           <div className="container mx-auto flex items-center justify-center">
             <div className="flex items-center gap-2">
               <ShoppingCart className="h-6 w-6 text-primary" />
               <span className="text-xl font-bold">SwiftCart NG</span>
             </div>
           </div>
         </header>
         
         <div className="flex-1 flex items-center justify-center p-4">
           <Card className="w-full max-w-md">
             <CardContent className="pt-6 text-center space-y-4">
               <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                 <XCircle className="h-6 w-6 text-destructive" />
               </div>
               <h2 className="text-xl font-semibold">Invalid Reset Link</h2>
               <p className="text-muted-foreground">{error}</p>
               <Link to="/auth/forgot-password">
                 <Button className="mt-4">Request New Reset Link</Button>
               </Link>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   if (success) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <header className="p-4 border-b">
           <div className="container mx-auto flex items-center justify-center">
             <div className="flex items-center gap-2">
               <ShoppingCart className="h-6 w-6 text-primary" />
               <span className="text-xl font-bold">SwiftCart NG</span>
             </div>
           </div>
         </header>
         
         <div className="flex-1 flex items-center justify-center p-4">
           <Card className="w-full max-w-md">
             <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
               </div>
               <h2 className="text-xl font-semibold">Password Reset Successful!</h2>
               <p className="text-muted-foreground">
                 Your password has been reset. Redirecting you to the login page...
               </p>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <header className="p-4 border-b">
         <div className="container mx-auto flex items-center justify-center">
           <div className="flex items-center gap-2">
             <ShoppingCart className="h-6 w-6 text-primary" />
             <span className="text-xl font-bold">SwiftCart NG</span>
           </div>
         </div>
       </header>
       
       <div className="flex-1 flex items-center justify-center p-4">
         <Card className="w-full max-w-md">
           <CardHeader className="space-y-1">
             <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
               <Lock className="h-6 w-6 text-primary" />
             </div>
             <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
             <CardDescription className="text-center">
               Create a new password for your account
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="password">New Password</Label>
                 <Input
                   id="password"
                   type="password"
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   minLength={6}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="confirmPassword">Confirm New Password</Label>
                 <Input
                   id="confirmPassword"
                   type="password"
                   placeholder="••••••••"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   required
                   minLength={6}
                 />
               </div>
               <Button 
                 type="submit" 
                 className="w-full" 
                 disabled={loading}
               >
                 {loading ? 'Resetting...' : 'Reset Password'}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }