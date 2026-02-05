 import { useState } from 'react';
 import { Link } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Label } from '@/components/ui/label';
 import { toast } from 'sonner';
 import { ArrowLeft, ShoppingCart, Mail, CheckCircle } from 'lucide-react';
 
 interface ForgotPasswordProps {
   returnTo?: string;
   portalType?: 'customer' | 'seller' | 'admin';
 }
 
 export default function ForgotPassword({ returnTo = '/auth/login', portalType = 'customer' }: ForgotPasswordProps) {
   const [email, setEmail] = useState('');
   const [loading, setLoading] = useState(false);
   const [emailSent, setEmailSent] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!email) {
       toast.error('Please enter your email address');
       return;
     }
 
     setLoading(true);
     
     try {
       const redirectUrl = `${window.location.origin}/auth/reset-password`;
       
       const { error } = await supabase.auth.resetPasswordForEmail(email, {
         redirectTo: redirectUrl,
       });
       
       if (error) {
         toast.error(error.message || 'Failed to send reset email');
       } else {
         setEmailSent(true);
         toast.success('Password reset email sent!');
       }
     } catch (error) {
       toast.error('An unexpected error occurred');
     } finally {
       setLoading(false);
     }
   };
 
   const getPortalLabel = () => {
     switch (portalType) {
       case 'seller':
         return 'Seller Portal';
       case 'admin':
         return 'Admin Portal';
       default:
         return 'SwiftCart NG';
     }
   };
 
   if (emailSent) {
     return (
       <div className="min-h-screen flex flex-col bg-background">
         <header className="p-4 border-b">
           <div className="container mx-auto flex items-center justify-between">
             <Link to={returnTo} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
               <ArrowLeft className="h-4 w-4" />
               <span className="text-sm font-medium">Back to Login</span>
             </Link>
             <div className="flex items-center gap-2">
               <ShoppingCart className="h-6 w-6 text-primary" />
               <span className="text-xl font-bold">{getPortalLabel()}</span>
             </div>
           </div>
         </header>
         
         <div className="flex-1 flex items-center justify-center p-4">
           <Card className="w-full max-w-md">
             <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
               </div>
               <h2 className="text-xl font-semibold">Check your email</h2>
               <p className="text-muted-foreground">
                 We've sent a password reset link to <strong>{email}</strong>
               </p>
               <p className="text-sm text-muted-foreground">
                 Didn't receive the email? Check your spam folder or{' '}
                 <button 
                   onClick={() => setEmailSent(false)} 
                   className="text-primary hover:underline"
                 >
                   try again
                 </button>
               </p>
               <Link to={returnTo}>
                 <Button variant="outline" className="mt-4">
                   Back to Login
                 </Button>
               </Link>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen flex flex-col bg-background">
       <header className="p-4 border-b">
         <div className="container mx-auto flex items-center justify-between">
           <Link to={returnTo} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
             <ArrowLeft className="h-4 w-4" />
             <span className="text-sm font-medium">Back to Login</span>
           </Link>
           <div className="flex items-center gap-2">
             <ShoppingCart className="h-6 w-6 text-primary" />
             <span className="text-xl font-bold">{getPortalLabel()}</span>
           </div>
         </div>
       </header>
       
       <div className="flex-1 flex items-center justify-center p-4">
         <Card className="w-full max-w-md">
           <CardHeader className="space-y-1">
             <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
               <Mail className="h-6 w-6 text-primary" />
             </div>
             <CardTitle className="text-2xl font-bold text-center">Forgot Password?</CardTitle>
             <CardDescription className="text-center">
               Enter your email address and we'll send you a link to reset your password
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="email">Email Address</Label>
                 <Input
                   id="email"
                   type="email"
                   placeholder="you@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
               </div>
               <Button 
                 type="submit" 
                 className="w-full" 
                 disabled={loading}
               >
                 {loading ? 'Sending...' : 'Send Reset Link'}
               </Button>
             </form>
             
             <div className="mt-6 text-center text-sm">
               <p className="text-muted-foreground">
                 Remember your password?{' '}
                 <Link to={returnTo} className="text-primary hover:underline font-medium">
                   Back to Login
                 </Link>
               </p>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }