import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
  userRole: 'admin' | 'seller' | 'customer' | null;
  sellerStatus: 'pending' | 'approved' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: 'customer' | 'seller') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'seller' | 'customer' | null>(null);
  const [sellerStatus, setSellerStatus] = useState<'pending' | 'approved' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin role after state change
        if (session?.user) {
          setTimeout(() => {
            checkUserRoleAndStatus(session.user.id);
          }, 0);
        } else {
          resetAuthState();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoleAndStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetAuthState = () => {
    setIsAdmin(false);
    setIsSeller(false);
    setIsCustomer(false);
    setUserRole(null);
    setSellerStatus(null);
  };

  const checkUserRoleAndStatus = async (userId: string) => {
    try {
      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error checking user role:', roleError);
      }

      if (roleData) {
        const role = roleData.role as 'admin' | 'seller' | 'customer';
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsSeller(role === 'seller');
        setIsCustomer(role === 'customer');

        // If seller, check approval status
        if (role === 'seller') {
          const { data: storeData } = await supabase
            .from('seller_stores')
            .select('is_approved')
            .eq('user_id', userId)
            .maybeSingle();

          if (storeData) {
            setSellerStatus(storeData.is_approved ? 'approved' : 'pending');
          } else {
            setSellerStatus('pending');
          }
        } else {
          setSellerStatus(null);
        }
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Check user role and redirect accordingly BEFORE updating state
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      const role = roleData?.role;
      
      // Update state immediately based on fetched role
      if (role) {
        setUserRole(role as 'admin' | 'seller' | 'customer');
        setIsAdmin(role === 'admin');
        setIsSeller(role === 'seller');
        setIsCustomer(role === 'customer');
      }
      
      // Navigate based on role - admin gets priority redirect
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'seller') {
        // Check seller approval status
        const { data: storeData } = await supabase
          .from('seller_stores')
          .select('is_approved')
          .eq('user_id', data.user.id)
          .maybeSingle();

        setSellerStatus(storeData?.is_approved ? 'approved' : 'pending');
        
        if (storeData?.is_approved) {
          navigate('/seller/dashboard', { replace: true });
        } else {
          navigate('/seller/pending-approval', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'seller' = 'customer') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    resetAuthState();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin, 
      isSeller, 
      isCustomer, 
      userRole, 
      sellerStatus,
      loading, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
